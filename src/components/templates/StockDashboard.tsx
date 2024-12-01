import { Card, CardBody, CardHeader, Select, SelectItem, Spinner, Tab, Tabs } from "@nextui-org/react";
import React, { useEffect, useState } from "react";

import EnhancedChartContainer from "@/components/organisms/ChartContainer";
import IndicatorControls, { Indicators } from "@/components/organisms/IndicatorControls";
import DataTable from "@/components/templates/Analytics/DataTable";
import type { StockData, TimeframeOption } from "@/types/stock";
import { filterDataByTimeframe, transformStockData } from "@/utils/stockUtils";
import { calculateEMA, calculateMACD, calculateRSI, calculateSMA } from "@/utils/technicalIndicators";

interface StockDashboardProps {
  jsonData: string;
}

const StockDashboard: React.FC<StockDashboardProps> = ({ jsonData }) => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M');
  const [selectedTab, setSelectedTab] = useState('price');
  const [indicators, setIndicators] = useState<Indicators>({
    sma: false,
    ema: false,
    macd: false,
    rsi: false
  });

  useEffect(() => {
    try {
      const parsedData = JSON.parse(jsonData);
      const transformedData = parsedData.Data.Data.map(transformStockData).sort(
        (a: StockData, b: StockData) =>
          new Date(a.date.split('/').reverse().join('-')).getTime() -
          new Date(b.date.split('/').reverse().join('-')).getTime()
      );

      // Calculate technical indicators
      const prices = transformedData.map(d => d.closePrice);
      const smaData = calculateSMA(prices, 20);
      const emaData = calculateEMA(prices, 20);
      const macdData = calculateMACD(prices);
      const rsiData = calculateRSI(prices);

      const enrichedData = transformedData.map((item, index) => ({
        ...item,
        sma: smaData[index],
        ema: emaData[index],
        macd: macdData.macd[index],
        signal: macdData.signal[index],
        histogram: macdData.histogram[index],
        rsi: rsiData[index]
      }));

      setData(enrichedData);
    } catch (error) {
      console.error('Error parsing data:', error);
    } finally {
      setLoading(false);
    }
  }, [jsonData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const filteredData = filterDataByTimeframe(data, timeframe);

  const handleTabChange = (key: React.Key) => {
    setSelectedTab(key.toString());
    // Enable relevant indicators based on selected tab
    if (key === 'macd') {
      setIndicators(prev => ({ ...prev, macd: true }));
    } else if (key === 'rsi') {
      setIndicators(prev => ({ ...prev, rsi: true }));
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
                timeframe={timeframe}
                selectedTab={selectedTab}
                indicators={indicators}
              />
            </Tab>

            <Tab
              key="volume"
              title="Volume"
              isDisabled={filteredData.length === 0}
            >
              <EnhancedChartContainer
                data={filteredData}
                timeframe={timeframe}
                selectedTab={selectedTab}
                indicators={indicators}
              />
            </Tab>

            <Tab
              key="macd"
              title="MACD"
              isDisabled={filteredData.length === 0}
            >
              <EnhancedChartContainer
                data={filteredData}
                timeframe={timeframe}
                selectedTab={selectedTab}
                indicators={indicators}
              />
            </Tab>

            <Tab
              key="rsi"
              title="RSI"
              isDisabled={filteredData.length === 0}
            >
              <EnhancedChartContainer
                data={filteredData}
                timeframe={timeframe}
                selectedTab={selectedTab}
                indicators={indicators}
              />
            </Tab>

            <Tab
              key="table"
              title="Data Table"
              isDisabled={filteredData.length === 0}
            >
              <DataTable data={filteredData} />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Add a tooltip or help text for indicators */}
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