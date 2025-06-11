import { Button, Input, Spinner, Tab, Tabs } from "@heroui/react";
import React, { useState } from "react";

import SharedDateControls from "@/components/organisms/SharedDateControls";
import Portfolio from "@/components/templates/Analytics/Portfolio/Portfolio";
import StockDashboard from "@/components/templates/Analytics/StockDashboard";
import { useSharedDates } from "@/hooks/useSharedDates";
import { useStockData } from "@/hooks/useStockData";
import { TimeframeOption } from "@/types/stock";

const TabbedAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState("analysis");
  const [inputSymbol, setInputSymbol] = useState("");

  // Use shared dates hook
  const { startDate, endDate, timeframe, setStartDate, setEndDate, setTimeframe, currentDate } = useSharedDates();

  // Stock data hook with shared dates
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

  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
  };

  return (
    <div className="w-full">
      {selectedTab === "analysis" && (
        <form className="mb-6 p-4 rounded-lg bg-content1 shadow-sm" onSubmit={handleMainStockSubmit}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-none w-32">
              <Input
                isRequired
                label="Stock Symbol"
                placeholder="e.g., AAPL"
                size="sm"
                type="text"
                value={inputSymbol}
                variant="bordered"
                onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              />
            </div>

            <SharedDateControls
              endDate={endDate}
              showDatePickers={true}
              startDate={startDate}
              timeframe={timeframe}
              onEndDateChange={setEndDate}
              onStartDateChange={setStartDate}
              onTimeframeChange={handleTimeframeChange}
            />

            <Button className="flex-none" color="primary" isDisabled={loading || !inputSymbol} size="lg" type="submit">
              {loading ? <Spinner color="white" size="sm" /> : "Fetch Data"}
            </Button>
          </div>
        </form>
      )}

      {error && <div className="p-4 mb-4 text-danger rounded-lg bg-danger-50">{error}</div>}

      <Tabs className="py-4" selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key.toString())}>
        <Tab key="analysis" title="Market Analysis">
          {mainStock && (
            <StockDashboard
              compareStocksData={comparisonStocks}
              stockData={mainStock.data}
              symbol={mainStock.symbol}
              timeframe={timeframe}
              onAddCompareStock={addComparisonStock}
              onRemoveCompareStock={removeComparisonStock}
            />
          )}
        </Tab>

        <Tab key="portfolio" title="Portfolio">
          <Portfolio
            dateControls={{
              startDate,
              endDate,
              timeframe,
              currentDate,
              onStartDateChange: setStartDate,
              onEndDateChange: setEndDate,
              onTimeframeChange: handleTimeframeChange,
            }}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

export default TabbedAnalytics;
