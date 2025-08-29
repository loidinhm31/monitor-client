import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@repo/ui/components/ui/card";
import { Activity, Database, Info, Settings, TrendingUp } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import SharedDateControls from "@repo/ui/components/organisms/shared-date-controls";
import Portfolio from "@repo/ui/components/templates/analytic-stocks/portfolio/Portfolio";
import StockDashboard from "@repo/ui/components/templates/analytic-stocks/stock-dashboard";
import { useSharedDates } from "@repo/ui/hooks/useSharedDates";
import { useStockData } from "@repo/ui/hooks/useStockData";
import { usePortfolio } from "@repo/ui/hooks/usePortfolio";
import { TimeframeOption } from "@repo/ui/types/stock";
import { DataSource } from "@repo/ui/lib/data-sources/stock-data-source-manager";
import { DataSourceSelector } from "@repo/ui/components/organisms/data-source-selector";
import { DataSourceStatus } from "@repo/ui/components/organisms/data-source-status";

const TabbedAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState("analysis");
  const [inputSymbol, setInputSymbol] = useState("");
  const [showSourceSettings, setShowSourceSettings] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const { startDate, endDate, timeframe, setStartDate, setEndDate, setTimeframe, currentDate } = useSharedDates();

  const {
    mainStock,
    comparisonStocks,
    loading: stockLoading,
    error: stockError,
    setMainStockSymbol,
    addComparisonStock,
    removeComparisonStock,
    currentDataSource: stockDataSource,
    changeDataSource: changeStockDataSource,
    checkSourceHealth,
  } = useStockData({
    startDate,
    endDate,
  });

  const {
    portfolioSymbols,
    holdingsData,
    compareData,
    loading: portfolioLoading,
    error: portfolioError,
    addSymbol,
    removeSymbol,
    refreshHoldings,
    loadComparisonData,
    currentPortfolioSource,
    changePortfolioDataSource,
  } = usePortfolio({
    startDate,
    endDate,
    currentDate,
  });

  // Determine loading state
  const isLoading = stockLoading || portfolioLoading;

  // Determine error state
  const currentError = stockError || portfolioError;

  // Get source health status
  const [sourceHealth, setSourceHealth] = useState<Partial<Record<DataSource, boolean>>>({});

  const handleMainStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymbol || stockLoading) return;

    try {
      await setMainStockSymbol(inputSymbol);
      setLastFetchTime(new Date());
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);

    // Automatically adjust start and end dates based on the selected timeframe
    switch (newTimeframe) {
      case "1W":
        setStartDate(currentDate.subtract({ weeks: 1 }));
        setEndDate(currentDate);
        break;
      case "1M":
        setStartDate(currentDate.subtract({ months: 1 }));
        setEndDate(currentDate);
        break;
      case "3M":
        setStartDate(currentDate.subtract({ months: 3 }));
        setEndDate(currentDate);
        break;
      case "6M":
        setStartDate(currentDate.subtract({ months: 6 }));
        setEndDate(currentDate);
        break;
      case "1Y":
        setStartDate(currentDate.subtract({ years: 1 }));
        setEndDate(currentDate);
        break;
      case "2Y":
        setStartDate(currentDate.subtract({ years: 2 }));
        setEndDate(currentDate);
        break;
      case "ALL":
        // For "ALL" timeframe, set a very early start date or keep current range
        // You can adjust this based on your specific requirements
        setStartDate(currentDate.subtract({ years: 10 })); // Example: 10 years ago
        setEndDate(currentDate);
        break;
      default:
        break;
    }
  };

  const handleStockDataSourceChange = useCallback(
    async (newSource: DataSource) => {
      try {
        await changeStockDataSource(newSource);
        setLastFetchTime(new Date());
      } catch (error) {
        console.error("Error changing stock data source:", error);
      }
    },
    [changeStockDataSource],
  );

  const handlePortfolioDataSourceChange = useCallback(
    async (newSource: DataSource) => {
      try {
        await changePortfolioDataSource(newSource);
      } catch (error) {
        console.error("Error changing portfolio data source:", error);
      }
    },
    [changePortfolioDataSource],
  );

  const updateSourceHealth = useCallback(async () => {
    try {
      const health = await checkSourceHealth();

      setSourceHealth(health);
    } catch (error) {
      console.error("Failed to check source health:", error);
    }
  }, [checkSourceHealth]);

  useEffect(() => {
    updateSourceHealth();
    // Update health every 60 seconds
    const interval = setInterval(updateSourceHealth, 60000);

    return () => clearInterval(interval);
  }, [updateSourceHealth]);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Data Source Management</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowSourceSettings(!showSourceSettings)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {!showSourceSettings && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      Analysis: <strong>{stockDataSource}</strong>
                    </span>
                    {sourceHealth[stockDataSource] !== undefined && (
                      <div
                        className={`w-2 h-2 rounded-full ${sourceHealth[stockDataSource] ? "bg-green-500" : "bg-red-500"}`}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    <span>
                      Portfolio: <strong>{currentPortfolioSource}</strong>
                    </span>
                    {sourceHealth[currentPortfolioSource] !== undefined && (
                      <div
                        className={`w-2 h-2 rounded-full ${sourceHealth[currentPortfolioSource] ? "bg-green-500" : "bg-red-500"}`}
                      />
                    )}
                  </div>
                </div>
              )}

              <DataSourceStatus />
            </div>
          </div>
        </CardHeader>

        {showSourceSettings && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <DataSourceSelector
                  className="w-full"
                  currentSource={stockDataSource}
                  disabled={isLoading}
                  showHealthStatus={true}
                  onSourceChange={handleStockDataSourceChange}
                />
                <p className="text-xs text-gray-500">
                  Primary source for stock analysis, comparison charts, and technical indicators
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                </div>
                <DataSourceSelector
                  className="w-full"
                  currentSource={currentPortfolioSource}
                  disabled={isLoading}
                  showHealthStatus={true}
                  onSourceChange={handlePortfolioDataSourceChange}
                />
                <p className="text-xs text-gray-500">
                  Source for portfolio tracking, holdings valuation, and performance analysis
                </p>
              </div>
            </div>

            {/* Detailed Source Status */}
            <DataSourceStatus showDetails={true} />
          </CardContent>
        )}
      </Card>

      {/* Error Display */}
      {currentError && (
        <div className="p-4 text-red-700 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium">Data Source Error</p>
              <p className="text-sm mt-1">{currentError}</p>
              <p className="text-xs mt-2 text-red-600">
                The system automatically tries fallback sources when the primary source fails.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs className="py-4" value={selectedTab} onValueChange={(key) => setSelectedTab(key)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger className="flex items-center gap-2" value="analysis">
            <TrendingUp className="w-4 h-4" />
            Market Analysis
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="portfolio">
            <Activity className="w-4 h-4" />
            Portfolio ({portfolioSymbols.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="analysis">
          {/* Analysis Tab - Stock Symbol */}
          <Card>
            <CardHeader>
              <h4 className="font-medium">Stock Analysis</h4>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleMainStockSubmit}>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-none w-40">
                    <Input
                      required
                      disabled={isLoading}
                      label="Stock Symbol"
                      placeholder="e.g., VN30, TCB, VIC"
                      type="text"
                      value={inputSymbol}
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

                  <Button className="flex items-center gap-2" disabled={isLoading || !inputSymbol} type="submit">
                    {isLoading ? <Spinner size="sm" /> : <TrendingUp className="w-4 h-4" />}
                    {isLoading ? "Fetching..." : "Analyze Stock"}
                  </Button>
                </div>

                {/* Data Source Info for Analysis */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <span>
                      Data source: <strong>{stockDataSource}</strong>
                    </span>
                    {lastFetchTime && <span>Last updated: {lastFetchTime.toLocaleTimeString()}</span>}
                  </div>
                  {sourceHealth[stockDataSource] !== undefined && (
                    <div className="flex items-center gap-1">
                      <span>Status:</span>
                      <div
                        className={`flex items-center gap-1 ${sourceHealth[stockDataSource] ? "text-green-600" : "text-red-600"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${sourceHealth[stockDataSource] ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span>{sourceHealth[stockDataSource] ? "Online" : "Offline"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Stock Dashboard */}
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

          {/* Getting Started Guide */}
          {!mainStock && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Analysis</h3>
                <p className="text-gray-500 mb-4">
                  Enter a stock symbol above to begin technical analysis with real-time data from {stockDataSource}.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                  <span>Popular symbols:</span>
                  {["VN30", "TCB", "VIC", "HPG", "VCB"].map((symbol) => (
                    <Button
                      key={symbol}
                      className="text-gray-600 hover:text-gray-900"
                      size="sm"
                      variant="ghost"
                      onClick={() => setInputSymbol(symbol)}
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          {/* Portfolio Tab */}
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
            portfolioProps={{
              portfolioSymbols,
              holdingsData,
              compareData,
              loading: portfolioLoading,
              error: portfolioError,
              addSymbol,
              removeSymbol,
              refreshHoldings,
              loadComparisonData,
              currentDataSource: currentPortfolioSource,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabbedAnalytics;
