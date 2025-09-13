import {
  DataSource,
  HistoricalDataParams,
  stockDataSourceManager,
  transformSingleToLegacyFormat,
  transformToLegacyFormat,
} from "@repo/ui/lib/data-sources/stock-data-source-manager";
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDate } from "@internationalized/date";
import { TransformedStockData } from "@repo/ui/types/stock";

const PORTFOLIO_STORAGE_KEY = "stockPortfolioSymbols";
const PORTFOLIO_SOURCE_KEY = "portfolioDataSource";

interface UsePortfolioOptions {
  startDate: CalendarDate;
  endDate: CalendarDate;
  currentDate: CalendarDate;
  dataSource?: DataSource;
}

interface PortfolioData {
  [symbol: string]: TransformedStockData[];
}

interface HoldingsData {
  [symbol: string]: TransformedStockData;
}

export const usePortfolio = ({ startDate, endDate, currentDate, dataSource }: UsePortfolioOptions) => {
  const [portfolioSymbols, setPortfolioSymbols] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentPortfolioSource, setCurrentPortfolioSource] = useState<DataSource>(() => {
    try {
      const stored = localStorage.getItem(PORTFOLIO_SOURCE_KEY);

      return (stored as DataSource) || dataSource || stockDataSourceManager.getDefaultSource();
    } catch {
      return dataSource || stockDataSourceManager.getDefaultSource();
    }
  });

  const [holdingsData, setHoldingsData] = useState<HoldingsData>({});
  const [compareData, setCompareData] = useState<PortfolioData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const isMounted = useRef(true);

  // Format date for API
  const formatDateForApi = useCallback((date: CalendarDate): string => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  }, []);

  // Fetch current data for a symbol
  const fetchCurrentData = useCallback(
    async (symbol: string): Promise<TransformedStockData> => {
      try {
        const standardData = await stockDataSourceManager.fetchCurrentData(symbol, currentPortfolioSource);

        return transformSingleToLegacyFormat(standardData);
      } catch (error) {
        console.error(`Error fetching current data for ${symbol}:`, error);
        throw error;
      }
    },
    [currentPortfolioSource],
  );

  // Fetch historical data for a symbol
  const fetchHistoricalData = useCallback(
    async (symbol: string): Promise<TransformedStockData[]> => {
      try {
        const params: HistoricalDataParams = {
          symbol: symbol,
          startDate: formatDateForApi(startDate),
          endDate: formatDateForApi(endDate),
        };

        const standardData = await stockDataSourceManager.fetchHistoricalData(params, currentPortfolioSource);

        return transformToLegacyFormat(standardData);
      } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        throw error;
      }
    },
    [startDate, endDate, currentPortfolioSource, formatDateForApi],
  );

  // Batch fetch current data for all symbols (more efficient)
  const fetchBatchCurrentData = useCallback(
    async (symbols: string[]): Promise<HoldingsData> => {
      try {
        const standardDataArray = await stockDataSourceManager.fetchMultipleCurrentData(
          symbols,
          currentPortfolioSource,
        );
        const holdingsMap: HoldingsData = {};

        standardDataArray.forEach((standardData) => {
          holdingsMap[standardData.symbol] = transformSingleToLegacyFormat(standardData);
        });

        return holdingsMap;
      } catch (error) {
        console.error("Error fetching batch current data:", error);
        // Fallback to individual requests
        const holdingsMap: HoldingsData = {};

        for (const symbol of symbols) {
          try {
            const data = await fetchCurrentData(symbol);

            holdingsMap[symbol] = data;
          } catch (err) {
            console.error(`Failed to fetch current data for ${symbol}:`, err);
          }
        }

        return holdingsMap;
      }
    },
    [currentPortfolioSource, fetchCurrentData],
  );

  // Refresh holdings data (current prices)
  const refreshHoldings = useCallback(async () => {
    if (loading || portfolioSymbols.length === 0) return;

    setLoading(true);
    setError("");

    try {
      // Use batch fetch for better performance
      const newHoldings = await fetchBatchCurrentData(portfolioSymbols);

      if (isMounted.current) {
        setHoldingsData(newHoldings);

        // Check if any symbols failed to load
        const failedSymbols = portfolioSymbols.filter((symbol) => !newHoldings[symbol]);

        if (failedSymbols.length > 0) {
          setError(`Failed to load data for: ${failedSymbols.join(", ")}`);
        }
      }
    } catch (error) {
      if (isMounted.current) {
        setError(`Failed to refresh holdings: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loading, portfolioSymbols, fetchBatchCurrentData]);

  // Load comparison data (historical)
  const loadComparisonData = useCallback(async () => {
    if (loading || portfolioSymbols.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const newData: PortfolioData = {};
      const errors: string[] = [];

      // Parallel fetch for better performance
      const fetchPromises = portfolioSymbols.map(async (symbol) => {
        try {
          const data = await fetchHistoricalData(symbol);

          return { symbol, data };
        } catch (err) {
          errors.push(symbol);
          console.error(`Error loading comparison data for ${symbol}:`, err);

          return null;
        }
      });

      const results = await Promise.all(fetchPromises);

      results.forEach((result) => {
        if (result && result.data.length > 0) {
          newData[result.symbol] = result.data;
        }
      });

      if (isMounted.current) {
        setCompareData(newData);
        if (errors.length > 0) {
          setError(`Failed to load comparison data for: ${errors.join(", ")}`);
        }
      }
    } catch (error) {
      if (isMounted.current) {
        setError(`Failed to load comparison data: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loading, portfolioSymbols, fetchHistoricalData]);

  // Add symbol to portfolio
  const addSymbol = useCallback(
    async (symbol: string): Promise<boolean> => {
      if (portfolioSymbols.includes(symbol)) {
        return false;
      }

      setLoading(true);
      setError("");

      try {
        // Test fetch to make sure symbol is valid
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
          setError(`Failed to add ${symbol}: ${error instanceof Error ? error.message : "Unknown error"}`);
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

  // Remove symbol from portfolio
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

  // Change portfolio data source
  const changePortfolioDataSource = useCallback(
    async (newSource: DataSource) => {
      setCurrentPortfolioSource(newSource);
      localStorage.setItem(PORTFOLIO_SOURCE_KEY, newSource);

      // Clear cache and refresh data with new source
      stockDataSourceManager.clearCache();

      if (portfolioSymbols.length > 0) {
        await refreshHoldings();
      }
    },
    [refreshHoldings, portfolioSymbols],
  );

  // Get available data sources
  const getAvailableDataSources = useCallback(() => {
    return stockDataSourceManager.getAvailableSources();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    // Portfolio data
    portfolioSymbols,
    holdingsData,
    compareData,
    loading,
    error,

    // Portfolio management
    addSymbol,
    removeSymbol,
    refreshHoldings,
    loadComparisonData,

    // Data source management
    currentPortfolioSource,
    changePortfolioDataSource,
    getAvailableDataSources,
  };
};
