import { CalendarDate } from "@internationalized/date";
import { useCallback, useEffect, useRef, useState } from "react";

import { HttpService } from "@/core/services/HttpService";
import { StockApiResponse, TransformedStockData } from "@/types/stock";
import { transformStockData } from "@/utils/stockUtils";

const PORTFOLIO_STORAGE_KEY = "stockPortfolioSymbols";
const PAGE_SIZE = 32;

interface UsePortfolioOptions {
  startDate: CalendarDate;
  endDate: CalendarDate;
  currentDate: CalendarDate;
}

interface PortfolioData {
  [symbol: string]: TransformedStockData[];
}

// Cache object to store recent API responses
const apiCache = new Map<string, { data: TransformedStockData | TransformedStockData[]; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds cache

export const usePortfolio = ({ startDate, endDate, currentDate }: UsePortfolioOptions) => {
  const [portfolioSymbols, setPortfolioSymbols] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);

      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading portfolio from storage:", error);

      return [];
    }
  });

  const [holdingsData, setHoldingsData] = useState<Record<string, TransformedStockData>>({});
  const [compareData, setCompareData] = useState<PortfolioData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchInProgress = useRef<Record<string, boolean>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatDateForApi = useCallback((date: CalendarDate): string => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  }, []);

  const getCacheKey = useCallback(
    (symbol: string, isHoldings: boolean): string => {
      if (isHoldings) {
        return `holdings-${symbol}-${formatDateForApi(currentDate)}`;
      }

      return `compare-${symbol}-${formatDateForApi(startDate)}-${formatDateForApi(endDate)}`;
    },
    [currentDate, startDate, endDate, formatDateForApi],
  );

  const getFromCache = useCallback(
    (symbol: string, isHoldings: boolean) => {
      const key = getCacheKey(symbol, isHoldings);
      const cached = apiCache.get(key);

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      return null;
    },
    [getCacheKey],
  );

  const setToCache = useCallback(
    (symbol: string, data: TransformedStockData | TransformedStockData[], isHoldings: boolean) => {
      const key = getCacheKey(symbol, isHoldings);

      apiCache.set(key, { data, timestamp: Date.now() });
    },
    [getCacheKey],
  );

  // Fetch single day data for holdings view
  const fetchCurrentData = useCallback(
    async (symbol: string): Promise<TransformedStockData | null> => {
      const cacheKey = getCacheKey(symbol, true);

      // Check if fetch is in progress
      if (fetchInProgress.current[cacheKey]) {
        return null;
      }

      // Check cache first
      const cachedData = getFromCache(symbol, true);

      if (cachedData) {
        return cachedData as TransformedStockData;
      }

      try {
        fetchInProgress.current[cacheKey] = true;
        const response = await HttpService.getAxiosClient().get<StockApiResponse>(
          "https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx",
          {
            params: {
              Symbol: symbol,
              StartDate: formatDateForApi(currentDate),
              EndDate: formatDateForApi(currentDate),
              PageIndex: 1,
              PageSize: 1,
            },
          },
        );

        if (response.data?.Data?.Data?.[0]) {
          const data = transformStockData(response.data.Data.Data[0]);

          setToCache(symbol, data, true);

          return data;
        }

        return null;
      } catch (error) {
        console.error(`Error fetching current data for ${symbol}:`, error);
        throw error;
      } finally {
        fetchInProgress.current[cacheKey] = false;
      }
    },
    [currentDate, formatDateForApi, getCacheKey, getFromCache, setToCache],
  );

  // Fetch a single page of historical data
  const fetchHistoricalDataPage = useCallback(
    async (symbol: string, pageIndex: number): Promise<StockApiResponse> => {
      try {
        const response = await HttpService.getAxiosClient().get<StockApiResponse>(
          "https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx",
          {
            params: {
              Symbol: symbol,
              StartDate: formatDateForApi(startDate),
              EndDate: formatDateForApi(endDate),
              PageIndex: pageIndex,
              PageSize: PAGE_SIZE,
            },
          },
        );

        return response.data;
      } catch (error) {
        console.error(`Error fetching page ${pageIndex} for ${symbol}:`, error);
        throw error;
      }
    },
    [startDate, endDate, formatDateForApi],
  );

  // Fetch all historical data for comparison view
  const fetchHistoricalData = useCallback(
    async (symbol: string): Promise<TransformedStockData[]> => {
      const cacheKey = getCacheKey(symbol, false);

      // Check if fetch is in progress
      if (fetchInProgress.current[cacheKey]) {
        return [];
      }

      // Check cache first
      const cachedData = getFromCache(symbol, false);

      if (cachedData) {
        return cachedData as TransformedStockData[];
      }

      try {
        fetchInProgress.current[cacheKey] = true;

        // Get first page to determine total count
        const firstPage = await fetchHistoricalDataPage(symbol, 1);

        if (!firstPage?.Data?.TotalCount || !Array.isArray(firstPage.Data.Data)) {
          throw new Error(`Invalid data format received from API for ${symbol}`);
        }

        const totalCount = firstPage.Data.TotalCount;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);

        let allData: TransformedStockData[] = firstPage.Data.Data.map(transformStockData);

        if (totalPages > 1) {
          const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
          const promises = remainingPages.map((pageIndex) => fetchHistoricalDataPage(symbol, pageIndex));
          const results = await Promise.all(promises);

          results.forEach((result: StockApiResponse) => {
            if (result?.Data?.Data && Array.isArray(result.Data.Data)) {
              const transformedData = result.Data.Data.map(transformStockData);

              allData = [...allData, ...transformedData];
            }
          });
        }

        // Sort data by date
        allData.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        setToCache(symbol, allData, false);

        return allData;
      } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        throw error;
      } finally {
        fetchInProgress.current[cacheKey] = false;
      }
    },
    [startDate, endDate, getCacheKey, getFromCache, setToCache, fetchHistoricalDataPage],
  );

  const refreshHoldings = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // Create array of promises for all symbols
      const promises = portfolioSymbols.map(async (symbol) => {
        try {
          const data = await fetchCurrentData(symbol);

          return { symbol, data, error: null };
        } catch (err) {
          console.error(`Error refreshing holdings for ${symbol}:`, err);

          return { symbol, data: null, error: err };
        }
      });

      // Wait for all requests to complete
      const results = await Promise.all(promises);

      if (isMounted.current) {
        const newHoldings: Record<string, TransformedStockData> = {};
        let hasErrors = false;

        // Process all results
        results.forEach(({ symbol, data, error }) => {
          if (data) {
            newHoldings[symbol] = data;
          }
          if (error) {
            hasErrors = true;
          }
        });

        setHoldingsData(newHoldings);
        if (hasErrors) {
          setError("Some symbols failed to load");
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loading, portfolioSymbols, fetchCurrentData]);

  const loadComparisonData = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const newData: PortfolioData = {};
      let hasErrors = false;

      for (const symbol of portfolioSymbols) {
        try {
          const data = await fetchHistoricalData(symbol);

          if (data.length > 0 && isMounted.current) {
            newData[symbol] = data;
          }
        } catch (err) {
          hasErrors = true;
          console.error(`Error loading comparison data for ${symbol}:`, err);
        }
      }

      if (isMounted.current) {
        setCompareData(newData);
        if (hasErrors) {
          setError("Some symbols failed to load");
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loading, portfolioSymbols, fetchHistoricalData]);

  // Add a new symbol to the portfolio
  const addSymbol = useCallback(
    async (symbol: string) => {
      if (portfolioSymbols.includes(symbol)) {
        return false;
      }

      setLoading(true);
      setError("");

      try {
        const currentData = await fetchCurrentData(symbol);

        if (currentData && isMounted.current) {
          const newSymbols = [...portfolioSymbols, symbol];

          setPortfolioSymbols(newSymbols);
          localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(newSymbols));

          setHoldingsData((prev) => ({
            ...prev,
            [symbol]: currentData,
          }));

          return true;
        }

        return false;
      } catch (error) {
        if (isMounted.current) {
          setError(`Failed to add ${symbol}`);
        }

        return false;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [portfolioSymbols, fetchCurrentData],
  );

  const removeSymbol = useCallback(
    (symbol: string) => {
      const newSymbols = portfolioSymbols.filter((s) => s !== symbol);

      setPortfolioSymbols(newSymbols);
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(newSymbols));

      setHoldingsData((prev) => {
        const newData = { ...prev };

        delete newData[symbol];

        return newData;
      });

      setCompareData((prev) => {
        const newData = { ...prev };

        delete newData[symbol];

        return newData;
      });
    },
    [portfolioSymbols],
  );

  return {
    portfolioSymbols,
    holdingsData,
    compareData,
    loading,
    error,
    addSymbol,
    removeSymbol,
    refreshHoldings,
    loadComparisonData,
  };
};
