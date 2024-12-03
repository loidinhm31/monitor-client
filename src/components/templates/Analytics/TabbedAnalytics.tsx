import { getLocalTimeZone, today } from "@internationalized/date";
import { Button, CalendarDate, DatePicker, Input, Spinner, Tab, Tabs } from "@nextui-org/react";
import React, { useState } from "react";

import Portfolio from "@/components/templates/Analytics/Portfolio";
import StockDashboard from "@/components/templates/Analytics/StockDashboard";
import { HttpService } from "@/core/services/HttpService";
import { StockApiResponse, TransformedStockData } from "@/types/stock";
import { formatCustomDate } from "@/utils/dateFormatterUtils";
import { transformStockData } from "@/utils/stockUtils";

const PAGE_SIZE = 32;

const TabbedAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState("analysis");
  const [portfolioData, setPortfolioData] = useState<TransformedStockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [inputSymbol, setInputSymbol] = useState("");
  const [mainSymbol, setMainSymbol] = useState("");
  const [mainStockData, setMainStockData] = useState<TransformedStockData[]>([]);
  const [compareStocksData, setCompareStocksData] = useState<Record<string, TransformedStockData[]>>({});

  const currentDate = today(getLocalTimeZone());
  const threeMonthsAgo = currentDate.subtract({ months: 3 });
  const [startDate, setStartDate] = useState<CalendarDate>(threeMonthsAgo);
  const [endDate, setEndDate] = useState<CalendarDate>(currentDate);

  const formatDateForApi = (date: CalendarDate): string => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  };

  const fetchDataPage = async (symbol: string, pageIndex: number): Promise<StockApiResponse> => {
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
  };

  const fetchAllData = async (symbol: string): Promise<TransformedStockData[]> => {
    try {
      const firstPage = await fetchDataPage(symbol, 1);

      if (!firstPage?.Data?.TotalCount || !Array.isArray(firstPage.Data.Data)) {
        throw new Error(`Invalid data format received from API for ${symbol}`);
      }

      const totalCount = firstPage.Data.TotalCount;
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);

      let allData: TransformedStockData[] = firstPage.Data.Data.map(transformStockData);

      if (totalPages > 1) {
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const promises = remainingPages.map((pageIndex) => fetchDataPage(symbol, pageIndex));

        const results = await Promise.all(promises);

        results.forEach((result: StockApiResponse) => {
          if (result?.Data?.Data && Array.isArray(result.Data.Data)) {
            const transformedData = result.Data.Data.map(transformStockData);
            allData = [...allData, ...transformedData];
          }
        });
      }

      return allData;
    } catch (error) {
      console.error(`Error fetching all data for ${symbol}:`, error);
      throw error;
    }
  };

  const handleMainStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymbol) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchAllData(inputSymbol);
      setMainStockData(data);
      setMainSymbol(inputSymbol);
      setCompareStocksData({}); // Clear comparison data when loading new main stock
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch stock data";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPrice = async (symbol: string) => {
    try {
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
        return transformStockData(response.data.Data.Data[0]);
      }
      return null;
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error);
      return null;
    }
  };

  const handleAddToPortfolio = async (symbol: string) => {
    setLoading(true);
    try {
      const priceData = await fetchCurrentPrice(symbol);
      if (priceData) {
        setPortfolioData((prev) => [...prev, priceData]);
      }
    } catch (error) {
      console.error("Error adding to portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompareStock = async (compareSymbol: string) => {
    if (compareSymbol === mainSymbol || compareSymbol in compareStocksData) {
      return;
    }

    try {
      const data = await fetchAllData(compareSymbol);
      setCompareStocksData((prev) => ({
        ...prev,
        [compareSymbol]: data,
      }));
    } catch (error) {
      console.error("Error adding comparison stock:", error);
      throw error;
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleMainStockSubmit} className="mb-6 p-4 rounded-lg bg-content1 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-none w-32">
            <Input
              type="text"
              label="Stock Symbol"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              size="sm"
              isRequired
              variant="bordered"
              placeholder="e.g., AAPL"
            />
          </div>

          <div className="flex-none w-48">
            <DatePicker
              showMonthAndYearPickers
              label={`Start Date (${formatCustomDate(startDate)})`}
              value={startDate}
              onChange={setStartDate}
              isRequired
            />
          </div>

          <div className="flex-none w-48">
            <DatePicker
              showMonthAndYearPickers
              label={`End Date (${formatCustomDate(endDate)})`}
              value={endDate}
              onChange={setEndDate}
              isRequired
            />
          </div>

          <Button color="primary" type="submit" size="lg" isDisabled={loading || !inputSymbol} className="flex-none">
            {loading ? <Spinner size="sm" color="white" /> : "Fetch Data"}
          </Button>
        </div>
      </form>

      {error && <div className="p-4 mb-4 text-danger rounded-lg bg-danger-50">{error}</div>}

      <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key.toString())} className="py-4">
        <Tab key="analysis" title="Market Analysis">
          {mainStockData.length > 0 && (
            <StockDashboard
              stockData={mainStockData}
              compareStocksData={compareStocksData}
              symbol={mainSymbol}
              onAddCompareStock={handleAddCompareStock}
              onRemoveCompareStock={(symbol) => {
                const newData = { ...compareStocksData };
                delete newData[symbol];
                setCompareStocksData(newData);
              }}
            />
          )}
        </Tab>

        <Tab key="portfolio" title="Portfolio">
          <Portfolio data={portfolioData} onAddStock={handleAddToPortfolio} loading={loading} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default TabbedAnalytics;
