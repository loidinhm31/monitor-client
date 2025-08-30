import { CalendarDate } from "@internationalized/date";
import { Button } from "@repo/ui/components/atoms/button";
import { Card, CardContent, CardHeader } from "@repo/ui/components/atoms/card";
import { Input } from "@repo/ui/components/atoms/input";
import { Spinner } from "@repo/ui/components/atoms/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/atoms/tabs";
import { Activity, Database, Plus, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import ResponsivePortfolioDataTable from "@repo/ui/components/templates/analytic-stocks/portfolio/ResponsivePortfolioDataTable";
import StockComparisonChart from "@repo/ui/components/templates/analytic-stocks/StockComparisonChart";
import { TimeframeOption } from "@repo/ui/types/stock";

export interface PortfolioProps {
  dateControls: {
    startDate: CalendarDate;
    endDate: CalendarDate;
    timeframe: TimeframeOption;
    currentDate: CalendarDate;
    onStartDateChange: (date: CalendarDate) => void;
    onEndDateChange: (date: CalendarDate) => void;
    onTimeframeChange: (timeframe: TimeframeOption) => void;
  };
  portfolioProps?: {
    portfolioSymbols: string[];
    holdingsData: HoldingsData;
    compareData: PortfolioData;
    loading: boolean;
    error: string;
    addSymbol: (symbol: string) => Promise<boolean>;
    removeSymbol: (symbol: string) => void;
    refreshHoldings: () => Promise<void>;
    loadComparisonData: () => Promise<void>;
    currentDataSource: DataSource;
  };
}
const Portfolio: React.FC<PortfolioProps> = ({ dateControls, portfolioProps }) => {
  const [newSymbol, setNewSymbol] = useState("");
  const [selectedTab, setSelectedTab] = useState("holdings");

  const {
    portfolioSymbols = [],
    holdingsData = {},
    compareData = {},
    loading = false,
    error = "",
    addSymbol,
    removeSymbol,
    refreshHoldings,
    loadComparisonData,
    currentDataSource = "TCBS",
  } = portfolioProps || {};

  // Auto-refresh holdings when switching to portfolio tab
  useEffect(() => {
    if (selectedTab === "holdings" && portfolioSymbols.length > 0) {
      refreshHoldings?.();
    }
  }, [selectedTab, portfolioSymbols.length, refreshHoldings]);

  // Load comparison data when switching to compare tab
  useEffect(() => {
    if (selectedTab === "compare" && portfolioSymbols.length > 0) {
      loadComparisonData?.();
    }
  }, [selectedTab, portfolioSymbols.length, loadComparisonData]);

  const handleAddSymbol = async () => {
    if (!newSymbol.trim() || !addSymbol) return;

    const success = await addSymbol(newSymbol.trim());
    if (success) {
      setNewSymbol("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSymbol();
    }
  };

  const tableData = Object.entries(holdingsData).map(([symbol, data]) => ({
    ...data,
    symbol,
  }));

  const comparisonData = Object.entries(compareData).map(([symbol, data]) => ({
    symbol,
    data: data.map((item) => ({
      date: item.date,
      closePrice: item.closePrice,
    })),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <h4 className="text-xl font-bold">Portfolio Management</h4>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Database className="w-4 h-4" />
            <span>
              Source: <strong>{currentDataSource}</strong>
            </span>
          </div>
        </div>
        <p className="text-sm text-default-500">Track your investments and compare performance</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Symbol Section */}
        <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-32">
            <Input
              label="Add Stock Symbol"
              placeholder="e.g., TCB, VIC, HPG"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleAddSymbol}
            disabled={loading || !newSymbol.trim() || portfolioSymbols.includes(newSymbol.trim())}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Portfolio
          </Button>
          {portfolioSymbols.length > 0 && (
            <Button variant="outline" onClick={refreshHoldings} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 text-red-700 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Portfolio Content */}
        {portfolioSymbols.length > 0 ? (
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="holdings">Holdings ({Object.keys(holdingsData).length})</TabsTrigger>
              <TabsTrigger value="compare">Compare ({Object.keys(compareData).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="holdings">
              <ResponsivePortfolioDataTable actionColumn={true} data={tableData} onRemoveStock={removeSymbol} />
            </TabsContent>

            <TabsContent value="compare">
              <div className="mt-4">
                <StockComparisonChart
                  description="Compare performance of stocks in your portfolio"
                  stocksData={comparisonData}
                  title="Portfolio Performance Comparison"
                  onRemoveStock={removeSymbol}
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-gray-500">Loading portfolio data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Activity className="w-16 h-16 mx-auto text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Build Your Portfolio</h3>
                  <p className="text-gray-500 mt-1">
                    Add stock symbols to track their performance and compare investments.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span>Popular stocks:</span>
                  {["TCB", "VCB", "HPG", "VIC", "MSN"].map((symbol) => (
                    <Button
                      key={symbol}
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewSymbol(symbol)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Portfolio;