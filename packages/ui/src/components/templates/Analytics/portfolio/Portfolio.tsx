import { CalendarDate } from "@internationalized/date";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { Plus, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import SharedDateControls from "@repo/ui/components/organisms/SharedDateControls";
import ResponsivePortfolioDataTable from "@repo/ui/components/templates/Analytics/portfolio/ResponsivePortfolioDataTable";
import StockComparisonChart from "@repo/ui/components/templates/Analytics/StockComparisonChart";
import { usePortfolio } from "@repo/ui/hooks/usePortfolio";
import { TimeframeOption } from "@repo/ui/types/stock";

interface PortfolioProps {
  dateControls: {
    startDate: CalendarDate;
    endDate: CalendarDate;
    timeframe: TimeframeOption;
    currentDate: CalendarDate;
    onStartDateChange: (date: CalendarDate) => void;
    onEndDateChange: (date: CalendarDate) => void;
    onTimeframeChange: (timeframe: TimeframeOption) => void;
  };
}

const Portfolio: React.FC<PortfolioProps> = ({ dateControls }) => {
  const [newSymbol, setNewSymbol] = useState("");
  const [selectedTab, setSelectedTab] = useState("holdings");
  const { startDate, endDate, timeframe, currentDate, onStartDateChange, onEndDateChange, onTimeframeChange } =
    dateControls;

  const {
    portfolioSymbols,
    holdingsData,
    compareData,
    loading,
    error,
    addSymbol,
    removeSymbol,
    refreshHoldings,
    loadComparisonData,
  } = usePortfolio({
    startDate,
    endDate,
    currentDate,
  });

  // Load holdings data initially and when currentDate changes
  useEffect(() => {
    if (selectedTab === "holdings") {
      refreshHoldings();
    }
  }, [currentDate, selectedTab]);

  // Load comparison data when switching to Compare tab or when date range changes
  useEffect(() => {
    if (selectedTab === "compare") {
      loadComparisonData();
    }
  }, [selectedTab, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      await addSymbol(newSymbol.trim().toUpperCase());
      setNewSymbol("");
    }
  };

  // Transform holdings data for table view
  const tableData = useMemo(() => {
    return Object.entries(holdingsData).map(([symbol, data]) => ({
      ...data,
      symbol,
    }));
  }, [holdingsData]);

  // Transform comparison data for chart
  const comparisonData = useMemo(() => {
    return Object.entries(compareData).map(([symbol, data]) => ({
      symbol,
      data: data.map((d) => ({
        date: d.date,
        closePrice: d.closePrice,
      })),
    }));
  }, [compareData]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
          <div className="flex-1">
            <h4 className="text-xl font-bold">portfolio Tracker</h4>
            <p className="text-sm text-default-500">Track your stock portfolio performance</p>
          </div>
          <div className="flex flex-row gap-4 items-center">
            <Button size="icon" className="min-w-10" variant="outline" disabled={loading} onClick={refreshHoldings}>
              <RefreshCw className="w-4 h-4" />
            </Button>

            <form className="flex gap-2 w-full sm:w-auto" onSubmit={handleSubmit}>
              <Input
                className="w-32"
                placeholder="Add stock symbol"
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              />
              <Button variant="default" disabled={loading || !newSymbol.trim()} type="submit">
                {loading ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
                Add
              </Button>
            </form>
          </div>
        </div>

        {selectedTab === "compare" && (
          <div className="w-full mt-4">
            <SharedDateControls
              endDate={endDate}
              showDatePickers={true}
              startDate={startDate}
              timeframe={timeframe}
              onEndDateChange={onEndDateChange}
              onStartDateChange={onStartDateChange}
              onTimeframeChange={onTimeframeChange}
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && <div className="text-danger text-sm mb-4 p-2 bg-danger-50 rounded">{error}</div>}

        {portfolioSymbols.length > 0 ? (
          <Tabs value={selectedTab} onValueChange={(key) => setSelectedTab(key)}>
            <TabsList>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
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
          <div className="text-center py-8 text-default-500">
            {loading ? <Spinner size="lg" /> : "No stocks in portfolio. Add some stocks to get started."}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Portfolio;
