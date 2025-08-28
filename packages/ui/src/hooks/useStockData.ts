import { CalendarDate } from "@internationalized/date";
import { useCallback, useEffect, useRef, useState } from "react";

import { HttpService } from "@repo/ui/lib/services/HttpService";
import { StockApiResponse, TransformedStockData } from "@repo/ui/types/stock";
import { transformStockData } from "@repo/ui/lib/stock-utils";

const PAGE_SIZE = 32;

interface UseStockDataProps {
  startDate: CalendarDate;
  endDate: CalendarDate;
  symbol?: string;
}

export interface StockDataItem {
  symbol: string;
  data: TransformedStockData[];
}

const getRandomSleep = () => Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cache object to store recent API responses
const apiCache = new Map<string, { data: TransformedStockData[]; timestamp: number }>();
const CACHE_DURATION = 10; // 5 seconds cache

export const useStockData = ({ startDate, endDate, symbol }: UseStockDataProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [mainStock, setMainStock] = useState<StockDataItem | null>(null);
  const [comparisonStocks, setComparisonStocks] = useState<Record<string, TransformedStockData[]>>({});

  const fetchInProgress = useRef<Record<string, boolean>>({});
  const isMounted = useRef(true);

  const formatDateForApi = useCallback((date: CalendarDate): string => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  }, []);

  const getCacheKey = useCallback(
    (stockSymbol: string) => {
      return `${stockSymbol}-${formatDateForApi(startDate)}-${formatDateForApi(endDate)}`;
    },
    [startDate, endDate, formatDateForApi],
  );

  const getFromCache = useCallback(
    (stockSymbol: string) => {
      const key = getCacheKey(stockSymbol);
      const cached = apiCache.get(key);

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      return null;
    },
    [getCacheKey],
  );

  const setToCache = useCallback(
    (stockSymbol: string, data: TransformedStockData[]) => {
      const key = getCacheKey(stockSymbol);

      apiCache.set(key, { data, timestamp: Date.now() });
    },
    [getCacheKey],
  );

  const fetchDataPage = useCallback(
    async (stockSymbol: string, pageIndex: number): Promise<StockApiResponse> => {
      try {
        // Add random delay between 500ms and 1500ms before each API call
        await sleep(getRandomSleep());

        const response = await HttpService.getAxiosClient().get<StockApiResponse>(
          "https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx",
          {
            params: {
              Symbol: stockSymbol,
              StartDate: formatDateForApi(startDate),
              EndDate: formatDateForApi(endDate),
              PageIndex: pageIndex,
              PageSize: PAGE_SIZE,
            },
          },
        );

        return response.data;
      } catch (error) {
        console.error(`Error fetching page ${pageIndex} for ${stockSymbol}:`, error);
        throw error;
      }
    },
    [startDate, endDate, formatDateForApi],
  );

  const fetchAllData = useCallback(
    async (stockSymbol: string): Promise<TransformedStockData[]> => {
      // Check cache first
      const cachedData = getFromCache(stockSymbol);

      if (cachedData) {
        return cachedData;
      }

      // If a fetch is already in progress for this symbol, skip
      if (fetchInProgress.current[stockSymbol]) {
        return [];
      }

      try {
        fetchInProgress.current[stockSymbol] = true;
        const firstPage = await fetchDataPage(stockSymbol, 1);

        if (!firstPage?.Data?.TotalCount || !Array.isArray(firstPage.Data.Data)) {
          throw new Error(`Invalid data format received from API for ${stockSymbol}`);
        }

        const totalCount = firstPage.Data.TotalCount;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);

        let allData: TransformedStockData[] = firstPage.Data.Data.map(transformStockData);

        if (totalPages > 1) {
          const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
          const promises = remainingPages.map((pageIndex) => fetchDataPage(stockSymbol, pageIndex));
          const results = await Promise.all(promises);

          results.forEach((result: StockApiResponse) => {
            if (result?.Data?.Data && Array.isArray(result.Data.Data)) {
              const transformedData = result.Data.Data.map(transformStockData);

              allData = [...allData, ...transformedData];
            }
          });
        }

        // Cache the results
        setToCache(stockSymbol, allData);

        return allData;
      } catch (error) {
        console.error(`Error fetching all data for ${stockSymbol}:`, error);
        throw error;
      } finally {
        if (isMounted.current) {
          fetchInProgress.current[stockSymbol] = false;
        }
      }
    },
    [fetchDataPage, getFromCache, setToCache],
  );

  useEffect(() => {
    if (!symbol) return;

    let ignore = false;

    const loadMainStockData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAllData(symbol);

        if (!ignore && isMounted.current) {
          setMainStock({ symbol, data });
          setComparisonStocks({});
        }
      } catch (error) {
        if (!ignore && isMounted.current) {
          const message = error instanceof Error ? error.message : "Failed to fetch stock data";

          setError(message);
        }
      } finally {
        if (!ignore && isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadMainStockData();

    return () => {
      ignore = true;
    };
  }, [symbol, fetchAllData]);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      fetchInProgress.current = {};
    };
  }, []);

  const setMainStockSymbol = useCallback(
    async (newSymbol: string) => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAllData(newSymbol);

        if (isMounted.current) {
          setMainStock({ symbol: newSymbol, data });
          setComparisonStocks({});
        }
      } catch (error) {
        if (isMounted.current) {
          const message = error instanceof Error ? error.message : "Failed to fetch stock data";

          setError(message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [fetchAllData],
  );

  const addComparisonStock = useCallback(
    async (newSymbol: string) => {
      if (newSymbol === mainStock?.symbol || newSymbol in comparisonStocks) {
        return false;
      }

      setLoading(true);
      setError("");
      try {
        const data = await fetchAllData(newSymbol);

        if (isMounted.current) {
          setComparisonStocks((prev) => ({
            ...prev,
            [newSymbol]: data,
          }));
        }

        return true;
      } catch (error) {
        if (isMounted.current) {
          const message = error instanceof Error ? error.message : "Failed to fetch comparison data";

          setError(message);
        }

        return false;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [mainStock?.symbol, comparisonStocks, fetchAllData],
  );

  const removeComparisonStock = useCallback((symbolToRemove: string) => {
    setComparisonStocks((prev) => {
      const newStocks = { ...prev };

      delete newStocks[symbolToRemove];

      return newStocks;
    });
  }, []);

  return {
    mainStock,
    comparisonStocks,
    loading,
    error,
    setMainStockSymbol,
    addComparisonStock,
    removeComparisonStock,
    fetchAllData,
  };
};
