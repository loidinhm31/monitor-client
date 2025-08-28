import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@repo/ui/components/ui/tabs";
import React, { useState } from "react";

import SharedDateControls from "@repo/ui/components/organisms/SharedDateControls";
import Portfolio from "@repo/ui/components/templates/Analytics/portfolio/Portfolio";
import StockDashboard from "@repo/ui/components/templates/Analytics/StockDashboard";
import { useSharedDates } from "@repo/ui/hooks/useSharedDates";
import { useStockData } from "@repo/ui/hooks/useStockData";
import { TimeframeOption } from "@repo/ui/types/stock";
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
                type="text"
                value={inputSymbol}
                variant="outline"
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

            <Button className="flex-none" variant="default" disabled={loading || !inputSymbol} size="lg" type="submit">
              {loading ? <Spinner size="sm" /> : "Fetch Data"}
            </Button>
          </div>
        </form>
      )}

      {error && <div className="p-4 mb-4 text-danger rounded-lg bg-danger-50">{error}</div>}

      <Tabs className="py-4" value={selectedTab} onValueChange={(key) => setSelectedTab(key)}>
        <TabsList>
          <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
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
        </TabsContent>

        <TabsContent value="portfolio">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabbedAnalytics;
