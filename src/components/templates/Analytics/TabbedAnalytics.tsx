import { getLocalTimeZone, today } from "@internationalized/date";
import { Button, CalendarDate, DatePicker, Input, Spinner, Tab, Tabs } from "@nextui-org/react";
import React, { useState } from "react";

import Portfolio from "@/components/templates/Analytics/Portfolio/Portfolio";
import StockDashboard from "@/components/templates/Analytics/StockDashboard";
import { useStockData } from "@/hooks/useStockData";
import { formatCustomDate } from "@/utils/dateFormatterUtils";

const TabbedAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState("analysis");
  const [inputSymbol, setInputSymbol] = useState("");

  // Date range state
  const currentDate = today(getLocalTimeZone());
  const threeMonthsAgo = currentDate.subtract({ months: 3 });
  const [startDate, setStartDate] = useState<CalendarDate>(threeMonthsAgo);
  const [endDate, setEndDate] = useState<CalendarDate>(currentDate);

  // Separate stock data hook for market analysis
  const { mainStock, comparisonStocks, loading, error, setMainStockSymbol, addComparisonStock, removeComparisonStock } =
    useStockData({
      startDate,
      endDate,
    });

  const handleMainStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymbol) return;
    await setMainStockSymbol(inputSymbol);
  };

  return (
    <div className="w-full">
      {selectedTab === "analysis" && (
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
      )}

      {error && <div className="p-4 mb-4 text-danger rounded-lg bg-danger-50">{error}</div>}

      <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key.toString())} className="py-4">
        <Tab key="analysis" title="Market Analysis">
          {mainStock && (
            <StockDashboard
              stockData={mainStock.data}
              compareStocksData={comparisonStocks}
              symbol={mainStock.symbol}
              onAddCompareStock={addComparisonStock}
              onRemoveCompareStock={removeComparisonStock}
            />
          )}
        </Tab>

        <Tab key="portfolio" title="Portfolio">
          <Portfolio dateRange={{ startDate, endDate }} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default TabbedAnalytics;
