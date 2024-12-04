import { Button, Input, Spinner, Tab, Tabs } from "@nextui-org/react";
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
        <form onSubmit={handleMainStockSubmit} className="mb-6 p-4 rounded-lg bg-content1 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
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

            <SharedDateControls
              startDate={startDate}
              endDate={endDate}
              timeframe={timeframe}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onTimeframeChange={handleTimeframeChange}
              showDatePickers={true}
            />

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
              timeframe={timeframe}
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
