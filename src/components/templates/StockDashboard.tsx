import { Card, CardBody, CardHeader, Select, SelectItem, Spinner, Tab, Tabs } from "@nextui-org/react";
import React, { useEffect, useState, useMemo } from "react";

import EnhancedChartContainer from "@/components/organisms/ChartContainer";
import IndicatorControls, { Indicators } from "@/components/organisms/IndicatorControls";
import DataTable from "@/components/templates/Analytics/DataTable";
import type { TimeframeOption, TransformedStockData, ChartData } from "@/types/stock";
import { filterDataByTimeframe } from "@/utils/stockUtils";
import { calculateEMA, calculateMACD, calculateRSI, calculateSMA } from "@/utils/technicalIndicators";

interface StockDashboardProps {
  stockData: TransformedStockData[];
}

const StockDashboard: React.FC<StockDashboardProps> = ({ stockData }) => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1M");
  const [selectedTab, setSelectedTab] = useState("price");
  const [indicators, setIndicators] = useState<Indicators>({
    sma: false,
    ema: false,
    macd: false,
    rsi: false,
    volume: false,
  });

  // Memoize the enriched data calculation
  const enrichedData = useMemo(() => {
    try {
      // Sort data chronologically for the chart
      const sortedData = [...stockData].sort((a, b) =>
        a.dateObj.getTime() - b.dateObj.getTime()
      );

      // Calculate technical indicators on sorted data
      const prices = sortedData.map((d) => d.closePrice);
      const smaData = calculateSMA(prices, 20);
      const emaData = calculateEMA(prices, 20);
      const macdData = calculateMACD(prices);
      const rsiData = calculateRSI(prices);

      return sortedData.map((item, index) => ({
        ...item,
        sma: smaData[index],
        ema: emaData[index],
        macd: macdData.macd[index],
        signal: macdData.signal[index],
        histogram: macdData.histogram[index],
        rsi: rsiData[index],
      })) as ChartData[];
    } catch (error) {
      console.error("Error enriching data:", error);
      return [] as ChartData[];
    }
  }, [stockData]);

  // Memoize filtered data
  const filteredData = useMemo(() =>
      filterDataByTimeframe(enrichedData, timeframe),
    [enrichedData, timeframe]
  );

  // Memoize table data (reverse chronological order)
  const tableData = useMemo(() =>
      [...filteredData].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()),
    [filteredData]
  );

  useEffect(() => {
    setLoading(false);
  }, [enrichedData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleTabChange = (key: React.Key) => {
    setSelectedTab(key.toString());
    if (key === "macd") {
      setIndicators((prev) => ({ ...prev, macd: true }));
    } else if (key === "rsi") {
      setIndicators((prev) => ({ ...prev, rsi: true }));
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4">
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h4 className="text-xl font-bold">Stock Market Analysis</h4>
          <div className="flex gap-4 items-center">
            <Select
              defaultSelectedKeys={[timeframe]}
              className="w-36"
              size="sm"
              onChange={(e) => setTimeframe(e.target.value as TimeframeOption)}
            >
              <SelectItem key="1W" value="1W">1 Week</SelectItem>
              <SelectItem key="1M" value="1M">1 Month</SelectItem>
              <SelectItem key="3M" value="3M">3 Months</SelectItem>
              <SelectItem key="6M" value="6M">6 Months</SelectItem>
            </Select>
          </div>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <IndicatorControls
            indicators={indicators}
            onIndicatorChange={setIndicators}
          />

          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            aria-label="Stock data views"
            className="mb-4"
            variant="underlined"
          >
            <Tab key="price" title="Price">
              <EnhancedChartContainer
                data={filteredData}
                selectedTab={selectedTab}
                indicators={indicators}
              />
            </Tab>

            <Tab key="macd" title="MACD" isDisabled={filteredData.length === 0}>
              <EnhancedChartContainer
                data={filteredData}
                selectedTab={selectedTab}
                indicators={indicators}
              />
            </Tab>

            <Tab key="rsi" title="RSI" isDisabled={filteredData.length === 0}>
              <EnhancedChartContainer
                data={filteredData}
                selectedTab={selectedTab}
                indicators={indicators}
              />
            </Tab>

            <Tab key="table" title="Data Table" isDisabled={filteredData.length === 0}>
              <DataTable data={tableData} />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <div className="mt-4 text-sm text-gray-500">
        <p>* SMA: Simple Moving Average (20 periods)</p>
        <p>* EMA: Exponential Moving Average (20 periods)</p>
        <p>* MACD: Moving Average Convergence Divergence (12, 26, 9)</p>
        <p>* RSI: Relative Strength Index (14 periods)</p>
      </div>
    </div>
  );
};

export default StockDashboard;