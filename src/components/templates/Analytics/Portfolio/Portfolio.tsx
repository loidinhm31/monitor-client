import { CalendarDate } from "@internationalized/date";
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Spinner, Tab, Tabs } from "@nextui-org/react";
import { Plus, RefreshCw } from "lucide-react";
import React, { useMemo, useState } from "react";

import ResponsivePortfolioDataTable from "@/components/templates/Analytics/Portfolio/ResponsivePortfolioDataTable";
import StockComparisonChart from "@/components/templates/Analytics/StockComparisonChart";
import { usePortfolio } from "@/hooks/usePortfolio";
import { TimeframeOption } from "@/types/stock";
import { filterDataByTimeframe } from "@/utils/stockUtils";

interface PortfolioProps {
  dateRange: {
    startDate: CalendarDate;
    endDate: CalendarDate;
  };
}

const Portfolio: React.FC<PortfolioProps> = ({ dateRange }) => {
  const [newSymbol, setNewSymbol] = useState("");
  const [selectedTab, setSelectedTab] = useState("holdings");
  const [timeframe, setTimeframe] = useState<TimeframeOption>("ALL");

  const { portfolioSymbols, portfolioData, loading, error, addSymbol, removeSymbol, refreshPortfolio } = usePortfolio({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const comparisonData = useMemo(() => {
    return Object.entries(portfolioData).map(([symbol, data]) => ({
      symbol,
      data: filterDataByTimeframe(data, timeframe).map((d) => ({
        date: d.date,
        closePrice: d.closePrice,
      })),
    }));
  }, [portfolioData, timeframe]);

  const tableData = useMemo(() => {
    return Object.entries(portfolioData)
      .map(([symbol, data]) => {
        const filteredData = filterDataByTimeframe(data, timeframe);
        // Get the most recent data point
        const latestData = filteredData[0];
        return latestData
          ? {
              ...latestData,
              symbol,
            }
          : null;
      })
      .filter(Boolean);
  }, [portfolioData, timeframe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      await addSymbol(newSymbol.trim().toUpperCase());
      setNewSymbol("");
    }
  };

  const handleRefresh = async () => {
    await refreshPortfolio();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
          <div className="flex-1">
            <h4 className="text-xl font-bold">Portfolio Tracker</h4>
            <p className="text-sm text-default-500">Track your stock portfolio performance</p>
          </div>
          <div className="flex flex-row gap-4 items-center">
            <Select
              defaultSelectedKeys={[timeframe]}
              onChange={(e) => setTimeframe(e.target.value as TimeframeOption)}
              className="w-full sm:w-48"
              size="sm"
              variant="bordered"
              aria-label="Select timeframe"
            >
              <SelectItem key="1W" value="1W">
                1 Week
              </SelectItem>
              <SelectItem key="1M" value="1M">
                1 Month
              </SelectItem>
              <SelectItem key="3M" value="3M">
                3 Months
              </SelectItem>
              <SelectItem key="6M" value="6M">
                6 Months
              </SelectItem>
              <SelectItem key="1Y" value="1Y">
                1 Year
              </SelectItem>
              <SelectItem key="2Y" value="2Y">
                2 Years
              </SelectItem>
              <SelectItem key="ALL" value="ALL">
                All Time
              </SelectItem>
            </Select>

            <Button isIconOnly variant="flat" onPress={handleRefresh} isLoading={loading} className="min-w-unit-10">
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
