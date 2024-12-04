import { CalendarDate } from "@internationalized/date";
import { Button, Card, CardBody, CardHeader, Input, Spinner, Tab, Tabs } from "@nextui-org/react";
import { Plus, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import SharedDateControls from "@/components/organisms/SharedDateControls";
import ResponsivePortfolioDataTable from "@/components/templates/Analytics/Portfolio/ResponsivePortfolioDataTable";
import StockComparisonChart from "@/components/templates/Analytics/StockComparisonChart";
import { usePortfolio } from "@/hooks/usePortfolio";
import { TimeframeOption } from "@/types/stock";

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
            <h4 className="text-xl font-bold">Portfolio Tracker</h4>
            <p className="text-sm text-default-500">Track your stock portfolio performance</p>
          </div>
          <div className="flex flex-row gap-4 items-center">
            <Button isIconOnly variant="flat" onPress={refreshHoldings} isLoading={loading} className="min-w-unit-10">
              <RefreshCw className="w-4 h-4" />
            </Button>

            <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
              <Input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="Add stock symbol"
                size="sm"
                className="w-32"
              />
              <Button
                color="primary"
                type="submit"
                isDisabled={loading || !newSymbol.trim()}
                startContent={loading ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
              >
                Add
              </Button>
            </form>
          </div>
        </div>

        {selectedTab === "compare" && (
          <div className="w-full mt-4">
            <SharedDateControls
              startDate={startDate}
              endDate={endDate}
              timeframe={timeframe}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
              onTimeframeChange={onTimeframeChange}
              showDatePickers={true}
            />
          </div>
        )}
      </CardHeader>

      <CardBody>
        {error && <div className="text-danger text-sm mb-4 p-2 bg-danger-50 rounded">{error}</div>}

        {portfolioSymbols.length > 0 ? (
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key.toString())}>
            <Tab key="holdings" title="Holdings">
              <ResponsivePortfolioDataTable data={tableData} onRemoveStock={removeSymbol} actionColumn={true} />
            </Tab>
            <Tab key="compare" title="Compare">
              <div className="mt-4">
                <StockComparisonChart
                  stocksData={comparisonData}
                  onRemoveStock={removeSymbol}
                  title="Portfolio Performance Comparison"
                  description="Compare performance of stocks in your portfolio"
                />
              </div>
            </Tab>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-default-500">
            {loading ? <Spinner size="lg" /> : "No stocks in portfolio. Add some stocks to get started."}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Portfolio;
