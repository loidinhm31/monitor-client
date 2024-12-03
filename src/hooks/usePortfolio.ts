import { CalendarDate } from "@internationalized/date";
import { useCallback, useEffect, useRef, useState } from "react";

import { useStockData } from "@/hooks/useStockData";
import { TransformedStockData } from "@/types/stock";

const PORTFOLIO_STORAGE_KEY = "stockPortfolioSymbols";

interface UsePortfolioOptions {
  startDate: CalendarDate;
  endDate: CalendarDate;
}

interface PortfolioData {
  [symbol: string]: TransformedStockData[];
}

export const usePortfolio = ({ startDate, endDate }: UsePortfolioOptions) => {
  const dateRangeRef = useRef({ startDate, endDate });
  const { fetchAllData } = useStockData({
    startDate: dateRangeRef.current.startDate,
    endDate: dateRangeRef.current.endDate,
  });

  const [portfolioSymbols, setPortfolioSymbols] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading portfolio from storage:", error);
      return [];
    }
  });

  const [portfolioData, setPortfolioData] = useState<PortfolioData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const loadingRef = useRef(false);
  const initialLoadDone = useRef(false);

  // Save portfolio symbols to localStorage
  const savePortfolioSymbols = useCallback((symbols: string[]) => {
    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(symbols));
    } catch (error) {
      console.error("Error saving portfolio to storage:", error);
    }
  }, []);

  useEffect(() => {
    if (loadingRef.current || initialLoadDone.current || portfolioSymbols.length === 0) {
      return;
    }

    const loadInitialData = async () => {
      loadingRef.current = true;
      setLoading(true);
      setError("");

      try {
        const newData: PortfolioData = {};
        let hasErrors = false;

        for (const symbol of portfolioSymbols) {
          try {
            if (!portfolioData[symbol]) {
              const data = await fetchAllData(symbol);
              if (data) {
                newData[symbol] = data;
              }
            }
          } catch (err) {
            hasErrors = true;
            console.error(`Error loading data for ${symbol}:`, err);
          }
        }

        if (Object.keys(newData).length > 0) {
          setPortfolioData(prev => ({
            ...prev,
            ...newData
          }));
        }

        if (hasErrors) {
          setError("Some symbols failed to load. Please try refreshing.");
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
        initialLoadDone.current = true;
      }
    };

    loadInitialData();
  }, []);

  const refreshPortfolio = useCallback(async (symbols?: string[]) => {
    if (loadingRef.current) return;

    // Update dateRange for the refresh
    dateRangeRef.current = { startDate, endDate };

    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const symbolsToRefresh = symbols || portfolioSymbols;
      const newData: PortfolioData = { ...portfolioData };
      let hasErrors = false;

      for (const symbol of symbolsToRefresh) {
        try {
          const data = await fetchAllData(symbol);
          if (data) {
            newData[symbol] = data;
          }
        } catch (err) {
          hasErrors = true;
          console.error(`Error refreshing data for ${symbol}:`, err);
        }
      }

      setPortfolioData(newData);

      if (hasErrors) {
        setError("Some symbols failed to refresh.");
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [portfolioSymbols, portfolioData, fetchAllData, startDate, endDate]);

  const addSymbol = useCallback(async (symbol: string) => {
    if (portfolioSymbols.includes(symbol)) {
      return false;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchAllData(symbol);
      if (data) {
        const newSymbols = [...portfolioSymbols, symbol];
        setPortfolioSymbols(newSymbols);
        savePortfolioSymbols(newSymbols);

        setPortfolioData(prev => ({
          ...prev,
          [symbol]: data
        }));
        return true;
      }
      return false;
    } catch (error) {
      setError(`Failed to add ${symbol}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [portfolioSymbols, fetchAllData, savePortfolioSymbols]);

  const removeSymbol = useCallback((symbol: string) => {
    const newSymbols = portfolioSymbols.filter(s => s !== symbol);
    setPortfolioSymbols(newSymbols);
    savePortfolioSymbols(newSymbols);

    setPortfolioData(prev => {
      const newData = { ...prev };
      delete newData[symbol];
      return newData;
    });
  }, [portfolioSymbols, savePortfolioSymbols]);

  const clearPortfolio = useCallback(() => {
    setPortfolioSymbols([]);
    setPortfolioData({});
    localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
  }, []);

  return {
    portfolioSymbols,
    portfolioData,
    loading,
    error,
    addSymbol,
    removeSymbol,
    clearPortfolio,
    refreshPortfolio
  };
};