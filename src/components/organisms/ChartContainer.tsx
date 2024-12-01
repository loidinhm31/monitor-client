import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartProps } from '@/types/stock';

interface ChartContainerProps extends ChartProps {
  selectedTab: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ data, selectedTab }) => {
  const renderChart = () => {
    if (selectedTab === 'price') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="closePrice"
              stroke="#0072F5"
              name="Close Price"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="openPrice"
              stroke="#17C964"
              name="Open Price"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (selectedTab === 'volume') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#7828C8"
              name="Trading Volume"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-[400px] mt-4">
      {renderChart()}
    </div>
  );
};

export default ChartContainer;