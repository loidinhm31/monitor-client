// components/EnhancedChartContainer.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartProps } from '@/types/stock';
import { Indicators } from '@/components/organisms/IndicatorControls';

interface EnhancedChartProps extends ChartProps {
  selectedTab: string;
  indicators: Indicators;
}

const EnhancedChartContainer: React.FC<EnhancedChartProps> = ({
                                                                data,
                                                                selectedTab,
                                                                indicators
                                                              }) => {
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
            {indicators.sma && (
              <Line
                type="monotone"
                dataKey="sma"
                stroke="#F5A524"
                name="SMA (20)"
                dot={false}
              />
            )}
            {indicators.ema && (
              <Line
                type="monotone"
                dataKey="ema"
                stroke="#17C964"
                name="EMA (20)"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (selectedTab === 'macd' && indicators.macd) {
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
            <ReferenceLine y={0} stroke="#666" />
            <Line
              type="monotone"
              dataKey="macd"
              stroke="#0072F5"
              name="MACD"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="signal"
              stroke="#F31260"
              name="Signal"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (selectedTab === 'rsi' && indicators.rsi) {
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
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={70} stroke="#F31260" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#17C964" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#7828C8"
              name="RSI"
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

export default EnhancedChartContainer;