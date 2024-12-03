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
  // Load initial symbols from localStorage
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

  // Initialize stock data hook
  const { fetchAllData } = useStockData({
    startDate,
    endDate,
  });

  // Keep portfolio symbols synced with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolioSymbols));
    } catch (error) {
      console.error("Error saving portfolio to storage:", error);
    }
  }, [portfolioSymbols]);

  // Load initial portfolio data
  useEffect(() => {
    const loadInitialData = async () => {
      if (loadingRef.current || initialLoadDone.current || portfolioSymbols.length === 0) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError("");

      try {
        const newData: PortfolioData = { ...portfolioData };
        let hasNewData = false;

        for (const symbol of portfolioSymbols) {
          if (!newData[symbol]) {
            try {
              const data = await fetchAllData(symbol);
              newData[symbol] = data;
              hasNewData = true;
            } catch (error) {
              console.error(`Error loading initial data for ${symbol}:`, error);
              setError((prev) => (prev ? `${prev}, ${symbol}` : `Failed to load: ${symbol}`));
            }
          }
        }

        if (hasNewData) {
          setPortfolioData(newData);
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
        initialLoadDone.current = true;
      }
    };

    loadInitialData();
  }, [portfolioSymbols, fetchAllData]);

  const addSymbol = useCallback(
    async (symbol: string) => {
      if (portfolioSymbols.includes(symbol)) {
        return false;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchAllData(symbol);
        setPortfolioSymbols((prev) => [...prev, symbol]);
        setPortfolioData((prev) => ({
          ...prev,
          [symbol]: data,
        }));
        return true;
      } catch (error) {
        console.error("Error adding symbol to portfolio:", error);
        setError(`Failed to add ${symbol}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [portfolioSymbols, fetchAllData],
  );

  const removeSymbol = useCallback((symbol: string) => {
    setPortfolioSymbols((prev) => prev.filter((s) => s !== symbol));
    setPortfolioData((prev) => {
      const newData = { ...prev };
      delete newData[symbol];
      return newData;
    });
  }, []);

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
  };
};
