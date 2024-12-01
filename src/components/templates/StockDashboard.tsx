import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Tab,
  Tabs,
  Spinner,
  Select,
  SelectItem,
} from "@nextui-org/react";
import ChartContainer from '@/components/organisms/ChartContainer';
import DataTable from '@/components/templates/Analytics/DataTable';
import { transformStockData, filterDataByTimeframe } from '@/utils/stockUtils';
import type { StockData, TimeframeOption } from '@/types/stock';

interface StockDashboardProps {
  jsonData: string;
}

const StockDashboard: React.FC<StockDashboardProps> = ({ jsonData }) => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M');
  const [selectedTab, setSelectedTab] = useState('price');

  useEffect(() => {
    try {
      const parsedData = JSON.parse(jsonData);
      const transformedData = parsedData.Data.Data.map(transformStockData).sort(
        (a: StockData, b: StockData) =>
          new Date(a.date.split('/').reverse().join('-')).getTime() -
          new Date(b.date.split('/').reverse().join('-')).getTime()
      );
      setData(transformedData);
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

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4">
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h4 className="text-xl font-bold">Stock Market Analysis</h4>
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
        </CardHeader>
        <CardBody className="px-6 py-4">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
            aria-label="Stock data views"
            className="mb-4"
          >
            <Tab key="price" title="Price Chart">
              <ChartContainer
                data={filteredData}
                timeframe={timeframe}
                selectedTab={selectedTab}
              />
            </Tab>

            <Tab key="volume" title="Volume Analysis">
              <ChartContainer
                data={filteredData}
                timeframe={timeframe}
                selectedTab={selectedTab}
              />
            </Tab>

            <Tab key="table" title="Data Table">
              <DataTable data={filteredData} />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default StockDashboard;