import { CalendarDate } from "@internationalized/date";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DataSource,
  HistoricalDataParams,
  stockDataSourceManager,
  transformToLegacyFormat,
} from "@repo/ui/lib/data-sources/stock-data-source-manager";
import { ResolutionOption, TransformedStockData } from "@repo/ui/types/stock";

interface UseStockDataOptions {
  startDate: CalendarDate;
  endDate: CalendarDate;
  resolution?: ResolutionOption;
  symbol?: string;
  dataSource?: DataSource;
}

export interface StockDataItem {
  symbol: string;
  data: TransformedStockData[];
  resolution: ResolutionOption;
}

export const useStockData = ({ startDate, endDate, resolution = "1D", dataSource }: UseStockDataOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [mainStock, setMainStock] = useState<StockDataItem | null>(null);
  const [comparisonStocks, setComparisonStocks] = useState<Record<string, TransformedStockData[]>>({});
  const [currentDataSource, setCurrentDataSource] = useState<DataSource>(
    dataSource || stockDataSourceManager.getDefaultSource(),
  );
  const [currentResolution, setCurrentResolution] = useState<ResolutionOption>(resolution);

  const fetchInProgress = useRef<Record<string, boolean>>({});
  const isMounted = useRef(true);

  // Format date for API
  const formatDateForApi = useCallback((date: CalendarDate): string => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    setCurrentResolution(resolution);
  }, [resolution]);

  // Helper to get supported resolutions for current symbol
  const getSupportedResolutions = useCallback((symbol?: string) => {
    if (!symbol) return ["1D", "1W", "1M"];

    return stockDataSourceManager.getSupportedResolutions(symbol);
  }, []);

  // Helper to validate resolution for symbol
  const validateResolution = useCallback(
    (symbol: string, resolution: ResolutionOption): ResolutionOption => {
      const supportedResolutions = getSupportedResolutions(symbol);

      if (!supportedResolutions.includes(resolution)) {
        console.warn(`Resolution ${resolution} not supported for ${symbol}, falling back to 1D`);

        return "1D";
      }

      return resolution;
    },
    [getSupportedResolutions],
  );

  // Fetch all historical data for a symbol
  const fetchAllData = useCallback(
    async (
      stockSymbol: string,
      preferredSource?: DataSource,
      forcedResolution?: ResolutionOption,
    ): Promise<TransformedStockData[]> => {
      if (!stockSymbol || fetchInProgress.current[stockSymbol]) {
        return [];
      }

      fetchInProgress.current[stockSymbol] = true;

      try {
        // Validate and adjust resolution for the symbol
        const validResolution = validateResolution(stockSymbol, forcedResolution || currentResolution);

        const params: HistoricalDataParams = {
          symbol: stockSymbol.toUpperCase(),
          startDate: formatDateForApi(startDate),
          endDate: formatDateForApi(endDate),
          resolution: validResolution,
        };

        // For VNGOLD, always use VNGOLD data source
        const sourceToUse = stockSymbol === "VNGOLD" ? "VNGOLD" : preferredSource || currentDataSource;

        const standardData = await stockDataSourceManager.fetchHistoricalData(params, sourceToUse);

        return transformToLegacyFormat(standardData);
      } catch (error) {
        console.error(`Error fetching data for ${stockSymbol}:`, error);
        throw error;
      } finally {
        fetchInProgress.current[stockSymbol] = false;
      }
    },
    [startDate, endDate, currentResolution, currentDataSource, formatDateForApi, validateResolution],
  );

  // Set main stock symbol
  const setMainStockSymbol = useCallback(
    async (symbol: string) => {
      if (!symbol || loading) return;

      setLoading(true);
      setError("");

      try {
        const upperSymbol = symbol.toUpperCase();

        // Validate resolution for the new symbol
        const validResolution = validateResolution(upperSymbol, currentResolution);

        if (validResolution !== currentResolution) {
          setCurrentResolution(validResolution);
        }

        const data = await fetchAllData(upperSymbol, currentDataSource, validResolution);

        if (isMounted.current) {
          setMainStock({
            symbol: upperSymbol,
            data,
            resolution: validResolution,
          });
        }
      } catch (error) {
        if (isMounted.current) {
          setError(error instanceof Error ? error.message : "Failed to fetch stock data");
          setMainStock(null);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [loading, currentResolution, currentDataSource, fetchAllData, validateResolution],
  );

  // Add comparison stock
  const addComparisonStock = useCallback(
    async (symbol: string) => {
      if (!symbol || comparisonStocks[symbol] || loading) return;

      setLoading(true);
      setError("");

      try {
        const upperSymbol = symbol.toUpperCase();

        // For comparison stocks, always use 1D resolution if it's VNGOLD
        const resolutionToUse = upperSymbol === "VNGOLD" ? "1D" : currentResolution;

        const data = await fetchAllData(upperSymbol, currentDataSource, resolutionToUse);

        if (isMounted.current) {
          setComparisonStocks((prev) => ({
            ...prev,
            [upperSymbol]: data,
          }));
        }
      } catch (error) {
        if (isMounted.current) {
          setError(error instanceof Error ? error.message : "Failed to fetch comparison data");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [comparisonStocks, loading, currentDataSource, currentResolution, fetchAllData],
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
  const changeStockDataSource = useCallback(
    async (newSource: DataSource) => {
      // Don't allow changing data source if main stock is VNGOLD
      if (mainStock?.symbol === "VNGOLD" && newSource !== "VNGOLD") {
        setError("Cannot change data source for Vietnamese Gold data");

        return;
      }

      setCurrentDataSource(newSource);
      stockDataSourceManager.clearCache();

      // Refresh main stock data with new source
      if (mainStock && mainStock.symbol !== "VNGOLD") {
        await setMainStockSymbol(mainStock.symbol);
      }

      // Refresh comparison stocks (except VNGOLD)
      const comparisonPromises = Object.keys(comparisonStocks)
        .filter((symbol) => symbol !== "VNGOLD")
        .map(async (symbol) => {
          try {
            const data = await fetchAllData(symbol, newSource);

            return { symbol, data };
          } catch (error) {
            console.error(`Error refreshing ${symbol}:`, error);

            return null;
          }
        });

      const results = await Promise.all(comparisonPromises);
      const updatedComparisons: Record<string, TransformedStockData[]> = { ...comparisonStocks };

      results.forEach((result) => {
        if (result) {
          updatedComparisons[result.symbol] = result.data;
        }
      });

      if (isMounted.current) {
        setComparisonStocks(updatedComparisons);
      }
    },
    [mainStock, comparisonStocks, setMainStockSymbol, fetchAllData],
  );

  const changeResolution = useCallback(
    async (newResolution: ResolutionOption): Promise<void> => {
      setCurrentResolution(newResolution);

      // Re-fetch main stock with new resolution
      if (mainStock) {
        const data = await fetchAllData(mainStock.symbol);

        setMainStock({
          symbol: mainStock.symbol,
          data,
          resolution: newResolution,
        });
      }

      // Re-fetch comparison stocks with new resolution
      const stockSymbols = Object.keys(comparisonStocks).map((key) => key.split("_")[0]);
      const uniqueSymbols = [...new Set(stockSymbols)];

      // Clear old resolution data and fetch new
      setComparisonStocks({});
      for (const symbol of uniqueSymbols) {
        await addComparisonStock(symbol!);
      }
    },
    [mainStock, comparisonStocks, fetchAllData, addComparisonStock],
  );

  // Get available data sources
  const getAvailableDataSources = useCallback(() => {
    const allSources = stockDataSourceManager.getAvailableSources();

    if (mainStock?.symbol === "VNGOLD") {
      return allSources.filter((source) => source.name === "VNGOLD");
    }

    // Otherwise, show all sources except VNGOLD (unless specifically needed)
    return allSources.filter((source) => source.name !== "VNGOLD");
  }, []);

  // Health check for all sources
  const checkSourceHealth = useCallback(async () => {
    return stockDataSourceManager.healthCheckAll();
  }, []);

  // Get source errors
  const getSourceErrors = useCallback(() => {
    return stockDataSourceManager.getSourceErrors();
  }, []);

  // Auto-refresh when date range or resolution changes
  useEffect(() => {
    const refreshData = async () => {
      if (mainStock) {
        await setMainStockSymbol(mainStock.symbol);
      }
    };

    refreshData();
  }, [startDate, endDate, currentResolution]);

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
    currentResolution,

    // Data management
    setMainStockSymbol,
    addComparisonStock,
    removeComparisonStock,
    fetchAllData,

    // Data source management
    currentDataSource,
    changeStockDataSource,
    getAvailableDataSources,
    checkSourceHealth,
    getSourceErrors,
    changeResolution,
  };
};
