import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Spinner, Tab, Tabs } from "@nextui-org/react";
import { Plus } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import ResponsivePortfolioDataTable from "@/components/templates/Analytics/Portfolio/ResponsivePortfolioDataTable";
import StockComparisonChart from "@/components/templates/Analytics/StockComparisonChart";
import { TimeframeOption } from "@/types/stock";
import { filterDataByTimeframe } from "@/utils/stockUtils";

interface PortfolioProps {
  symbols: string[];
  onAddSymbol: (symbol: string) => Promise<void>;
  onRemoveSymbol: (symbol: string) => void;
  dateRange: {
    startDate: CalendarDate;
    endDate: CalendarDate;
  };
  stockDataHook: any;
}

const Portfolio: React.FC<PortfolioProps> = ({ symbols, onAddSymbol, onRemoveSymbol, dateRange, stockDataHook }) => {
  const [newSymbol, setNewSymbol] = useState("");
  const [selectedTab, setSelectedTab] = useState("holdings");
  const [timeframe, setTimeframe] = useState<TimeframeOption>("ALL");

  const { loading, error, fetchAllData } = stockDataHook(dateRange);

  const [portfolioData, setPortfolioData] = useState<{ [symbol: string]: any }>({});

  useEffect(() => {
    const loadPortfolioData = async () => {
      const newData = { ...portfolioData };
      for (const symbol of symbols) {
        if (!portfolioData[symbol]) {
          // Only fetch if we don't have the data
          try {
            const data = await fetchAllData(symbol);
            newData[symbol] = data;
          } catch (error) {
            console.error(`Error loading data for ${symbol}:`, error);
          }
        }
      }
      setPortfolioData((prev) => ({ ...prev, ...newData }));
    };

    loadPortfolioData();
  }, [symbols, dateRange.startDate, dateRange.endDate]);

  // Handle removing data when a symbol is removed
  useEffect(() => {
    const currentSymbols = new Set(symbols);
    const toRemove = Object.keys(portfolioData).filter((symbol) => !currentSymbols.has(symbol));

    if (toRemove.length > 0) {
      setPortfolioData((prev) => {
        const newData = { ...prev };
        toRemove.forEach((symbol) => delete newData[symbol]);
        return newData;
      });
    }
  }, [symbols]);

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
    return Object.entries(portfolioData).map(([symbol, data]) => {
      const latestData = data[0]; // Assuming data is sorted newest first
      return {
        ...latestData,
        symbol,
      };
    });
  }, [portfolioData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      await onAddSymbol(newSymbol.trim());
      setNewSymbol("");
    }
  };

  const handleRemoveStock = (symbol: string) => {
    onRemoveSymbol(symbol);
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
              className="w-full"
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
            <form onSubmit={handleSubmit} className="flex gap-2 w-full">
              <Input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="Add stock symbol"
                size="sm"
                className="w-full py-1"
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

        {tableData.length > 0 ? (
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key.toString())}>
            <Tab key="holdings" title="Holdings">
              <ResponsivePortfolioDataTable data={tableData} onRemoveStock={handleRemoveStock} actionColumn={true} />
            </Tab>
            <Tab key="compare" title="Compare">
              <div className="mt-4">
                <StockComparisonChart
                  stocksData={comparisonData}
                  onRemoveStock={handleRemoveStock}
                  title="Portfolio Performance Comparison"
                  description="Compare performance of stocks in your portfolio"
                />
              </div>
            </Tab>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-default-500">
            No stocks in portfolio. Add some stocks to get started.
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Portfolio;
