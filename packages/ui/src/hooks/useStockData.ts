import { CalendarDate } from "@internationalized/date";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DataSource,
  HistoricalDataParams,
  stockDataSourceManager,
  transformToLegacyFormat,
} from "@repo/ui/lib/data-sources/stock-data-source-manager";

import { TransformedStockData } from "@repo/ui/types/stock";

interface UseStockDataOptions {
  startDate: CalendarDate;
  endDate: CalendarDate;
  symbol?: string;
  dataSource?: DataSource;
}

export interface StockDataItem {
  symbol: string;
  data: TransformedStockData[];
}

export const useStockData = ({ startDate, endDate, symbol, dataSource }: UseStockDataOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [mainStock, setMainStock] = useState<StockDataItem | null>(null);
  const [comparisonStocks, setComparisonStocks] = useState<Record<string, TransformedStockData[]>>({});
  const [currentDataSource, setCurrentDataSource] = useState<DataSource>(
    dataSource || stockDataSourceManager.getDefaultSource(),
  );

  const fetchInProgress = useRef<Record<string, boolean>>({});
  const isMounted = useRef(true);

  // Format date for API
  const formatDateForApi = useCallback((date: CalendarDate): string => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  }, []);

  // Fetch all historical data for a symbol
  const fetchAllData = useCallback(
    async (stockSymbol: string, preferredSource?: DataSource): Promise<TransformedStockData[]> => {
      const source = preferredSource || currentDataSource;
      const cacheKey = `${stockSymbol}-${source}-${formatDateForApi(startDate)}-${formatDateForApi(endDate)}`;

      // Check if fetch is already in progress
      if (fetchInProgress.current[cacheKey]) {
        // Wait for ongoing fetch to complete
        let attempts = 0;
        while (fetchInProgress.current[cacheKey] && attempts < 100) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }
        return [];
      }

      try {
        fetchInProgress.current[cacheKey] = true;

        const params: HistoricalDataParams = {
          symbol: stockSymbol,
          startDate: formatDateForApi(startDate),
          endDate: formatDateForApi(endDate),
          limit: 1000, // Get comprehensive data
        };

        const standardData = await stockDataSourceManager.fetchHistoricalData(params, source);

        // Transform to legacy format for backward compatibility with existing components
        const transformedData = transformToLegacyFormat(standardData);

        return transformedData;
      } catch (error) {
        throw new Error(
          `Failed to fetch data for ${stockSymbol}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        fetchInProgress.current[cacheKey] = false;
      }
    },
    [startDate, endDate, formatDateForApi, currentDataSource],
  );

  // Set main stock symbol
  const setMainStockSymbol = useCallback(
    async (newSymbol: string, preferredSource?: DataSource) => {
      if (loading) return;

      setLoading(true);
      setError("");

      try {
        const data = await fetchAllData(newSymbol, preferredSource);

        if (isMounted.current) {
          setMainStock({
            symbol: newSymbol,
            data: data,
          });
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
    [fetchAllData, loading],
  );

  // Add comparison stock
  const addComparisonStock = useCallback(
    async (newSymbol: string, preferredSource?: DataSource) => {
      if (newSymbol === mainStock?.symbol || newSymbol in comparisonStocks) {
        return false;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchAllData(newSymbol, preferredSource);

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

  // Remove comparison stock
  const removeComparisonStock = useCallback((symbolToRemove: string) => {
    setComparisonStocks((prev) => {
      const newStocks = { ...prev };

      delete newStocks[symbolToRemove];

      return newStocks;
    });
  }, []);

  // Change data source and refresh data
  const changeDataSource = useCallback(
    async (newSource: DataSource) => {
      setCurrentDataSource(newSource);
      stockDataSourceManager.setDefaultSource(newSource);

      // Clear cache to force fresh data from new source
      stockDataSourceManager.clearCache();

      // Reload current data with new source if we have a main stock
      if (mainStock) {
        setLoading(true);
        try {
          await setMainStockSymbol(mainStock.symbol, newSource);

          // Reload comparison stocks too
          const comparisonPromises = Object.keys(comparisonStocks).map(async (symbol) => {
            try {
              const data = await fetchAllData(symbol, newSource);

              return { symbol, data };
            } catch (_error) {
              return null;
            }
          });

          const results = await Promise.all(comparisonPromises);
          const newComparisonStocks: Record<string, TransformedStockData[]> = {};

          results.forEach((result) => {
            if (result) {
              newComparisonStocks[result.symbol] = result.data;
            }
          });

          setComparisonStocks(newComparisonStocks);
        } catch (error) {
          setError(`Failed to switch to ${newSource}: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
          setLoading(false);
        }
      }
    },
    [mainStock, comparisonStocks, setMainStockSymbol, fetchAllData],
  );

  // Get available data sources
  const getAvailableDataSources = useCallback(() => {
    return stockDataSourceManager.getAvailableSources();
  }, []);

  // Health check for all sources
  const checkSourceHealth = useCallback(async () => {
    return stockDataSourceManager.healthCheckAll();
  }, []);

  // Get source errors
  const getSourceErrors = useCallback(() => {
    return stockDataSourceManager.getSourceErrors();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    // Core data
    mainStock,
    comparisonStocks,
    loading,
    error,

    // Data management
    setMainStockSymbol,
    addComparisonStock,
    removeComparisonStock,
    fetchAllData,

    // Data source management
    currentDataSource,
    changeDataSource,
    getAvailableDataSources,
    checkSourceHealth,
    getSourceErrors,
  };
};
