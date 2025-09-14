import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@repo/ui/components/atoms/card";
import { Button } from "@repo/ui/components/atoms/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/atoms/tabs";
import { Activity, Database, Plus, RefreshCw } from "lucide-react";
import { CalendarDate } from "@internationalized/date";
import { ColumnKey, DataSource, ResolutionOption, TimeframeOption, TransformedStockData } from "@repo/ui/types/stock";
import PortfolioComparison from "@repo/ui/components/templates/analytic-stocks/portfolio/portfolio-comparison";
import { InputLabel } from "@repo/ui/components/atoms/input-label";
import ResponsiveDataTable from "@repo/ui/components/templates/analytic-stocks/responsive-data-table";
import { COLUMN_LABELS } from "@repo/ui/lib/stock-utils";

interface DateControls {
  startDate: CalendarDate;
  endDate: CalendarDate;
  timeframe: TimeframeOption;
  currentDate: CalendarDate;
  resolution: ResolutionOption;
  onStartDateChange: (date: CalendarDate) => void;
  onEndDateChange: (date: CalendarDate) => void;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  onResolutionChange: (resolution: ResolutionOption) => void;
}

interface HoldingsData {
  [symbol: string]: TransformedStockData;
}

interface PortfolioData {
  [symbol: string]: TransformedStockData[];
}

interface PortfolioProps {
  dateControls: DateControls;
  portfolioProps: {
    portfolioSymbols: string[];
    holdingsData: HoldingsData;
    compareData: PortfolioData;
    loading: boolean;
    error: string;
    addSymbol: (symbol: string) => Promise<boolean>;
    removeSymbol: (symbol: string) => void;
    refreshHoldings: () => void;
    loadComparisonData: () => void;
    currentDataSource: DataSource;
  };
}

const Portfolio: React.FC<PortfolioProps> = ({ portfolioProps }) => {
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
    currentDataSource,
  } = portfolioProps || {};

  const columns = [
    { key: "symbol" as ColumnKey, label: "Symbol" },
    { key: "date" as ColumnKey, label: COLUMN_LABELS.date },
    { key: "closePrice" as ColumnKey, label: COLUMN_LABELS.closePrice },
    { key: "priceChange" as ColumnKey, label: COLUMN_LABELS.change },
    { key: "volume" as ColumnKey, label: COLUMN_LABELS.volume },
    { key: "openPrice" as ColumnKey, label: COLUMN_LABELS.openPrice },
    { key: "highestPrice" as ColumnKey, label: COLUMN_LABELS.highestPrice },
    { key: "lowestPrice" as ColumnKey, label: COLUMN_LABELS.lowestPrice },
    { key: "actions" as ColumnKey, label: "Actions" },
  ];

  // Auto-refresh holdings when switching to holdings tab
  useEffect(() => {
    if (selectedTab === "holdings" && portfolioSymbols.length > 0 && refreshHoldings) {
      refreshHoldings();
    }
  }, [selectedTab, portfolioSymbols.length, refreshHoldings]);

  // Load comparison data when switching to compare tab
  useEffect(() => {
    if (selectedTab === "compare" && portfolioSymbols.length > 0 && loadComparisonData) {
      loadComparisonData();
    }
  }, [selectedTab, portfolioSymbols.length, loadComparisonData]);

  const handleAddSymbol = async () => {
    if (!newSymbol.trim() || !addSymbol) return;

    const success = await addSymbol(newSymbol.trim().toUpperCase());

    if (success) {
      setNewSymbol("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSymbol();
    }
  };

  // Transform holdings data for table
  const tableData = Object.entries(holdingsData).map(([symbol, data]) => ({
    ...data,
    symbol,
  }));

  // Transform comparison data for chart
  const comparisonData = Object.entries(compareData).flatMap(([symbol, dataArray]) =>
    dataArray.map((item) => ({
      ...item,
      symbol,
    })),
  );

  return (
    <Card className="w-full" variant="holographic">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400/80" />
            <h4 className="text-xl font-bold text-cyan-400">Portfolio Management</h4>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Database className="w-4 h-4 text-cyan-400/80" />
            <span className="text-cyan-400/80">
              Source: <strong>{currentDataSource}</strong>
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Track your investments and compare performance</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Symbol Section */}
        <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/10 rounded-lg">
          <div className="flex-1 min-w-48">
            <InputLabel
              disabled={loading}
              label="Add Stock Symbol"
              placeholder="e.g., TCB, VIC, HPG"
              value={newSymbol}
              variant="holographic"
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button
            className="flex items-center gap-2"
            disabled={loading || !newSymbol.trim() || portfolioSymbols.includes(newSymbol.trim().toUpperCase())}
            variant="holographic"
            onClick={handleAddSymbol}
          >
            <Plus className="w-4 h-4" />
            Add to Portfolio
          </Button>
          {portfolioSymbols.length > 0 && (
            <Button
              className="flex items-center gap-2"
              disabled={loading}
              variant="holographic"
              onClick={refreshHoldings}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Portfolio Content */}
        {portfolioSymbols.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No stocks in portfolio</h3>
            <p className="text-muted-foreground">Add some stock symbols above to start tracking your portfolio</p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-4">
              <span>Popular symbols:</span>
              {["VN30", "TCB", "VIC", "HPG", "VCB"].map((symbol) => (
                <Button
                  key={symbol}
                  className="text-muted-foreground hover:text-foreground"
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewSymbol(symbol)}
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <Tabs className="w-full" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2" variant="holographic">
              <TabsTrigger className="flex items-center gap-2" value="holdings" variant="holographic">
                <Activity className="w-4 h-4" />
                Holdings ({portfolioSymbols.length})
              </TabsTrigger>
              <TabsTrigger className="flex items-center gap-2" value="compare" variant="holographic">
                <Database className="w-4 h-4" />
                Compare Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4 mt-6" value="holdings">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading portfolio data...</span>
                  </div>
                </div>
              ) : (
                <ResponsiveDataTable
                  columns={columns}
                  data={tableData}
                  isPortfolio={true}
                  onRemoveStock={removeSymbol}
                />
              )}
            </TabsContent>

            <TabsContent className="space-y-4 mt-6" value="compare">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading comparison data...</span>
                  </div>
                </div>
              ) : (
                <PortfolioComparison
                  loading={loading}
                  portfolioData={comparisonData}
                  onAddStock={async (symbol: string) => {
                    await addSymbol(symbol);
                    if (loadComparisonData) {
                      loadComparisonData();
                    }
                  }}
                  onRemoveStock={(symbol: string) => {
                    removeSymbol(symbol);
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Portfolio Summary */}
        {portfolioSymbols.length > 0 && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  <span className="text-cyan-500">{portfolioSymbols.length}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-cyan-200">
                    {portfolioSymbols.length}
                    Stocks Tracked
                  </span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  <span className="text-cyan-500">{Object.keys(holdingsData).length}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-cyan-200">Current Holdings</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  <span className="text-cyan-500">{Object.keys(compareData).length}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-cyan-200">Historical Data</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Portfolio;
