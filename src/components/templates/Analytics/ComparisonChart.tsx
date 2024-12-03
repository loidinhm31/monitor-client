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
import { Card, CardBody, CardHeader, Button, ButtonGroup } from "@nextui-org/react";
import { X as CloseIcon } from "lucide-react";
import ComparisonTooltip from "@/components/organisms/ComparisonTooltip";

// Color palette for different stocks
const STOCK_COLORS = [
  "#0072F5", // Blue
  "#17C964", // Green
  "#F5A524", // Yellow
  "#F31260", // Red
  "#7828C8", // Purple
  "#00B8D9", // Cyan
];

interface ComparisonChartProps {
  stocksData: {
    symbol: string;
    data: Array<{
      date: string;
      closePrice: number;
    }>;
  }[];
  onRemoveStock: (symbol: string) => void;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({
                                                           stocksData,
                                                           onRemoveStock
                                                         }) => {
  // Normalize data for comparison (convert to percentage change from first day)
  const normalizedData = React.useMemo(() => {
    if (!stocksData.length) return [];

    // Get all unique dates
    const allDates = new Set<string>();
    stocksData.forEach(stock => {
      stock.data.forEach(point => allDates.add(point.date));
    });
    const sortedDates = Array.from(allDates).sort();

    // Get initial prices for each stock
    const initialPrices: Record<string, number> = {};
    stocksData.forEach(stock => {
      if (stock.data.length > 0) {
        initialPrices[stock.symbol] = stock.data[0].closePrice;
      }
    });

    // Create normalized data points
    return sortedDates.map(date => {
      const dataPoint: {
        date: string;
        [key: string]: any;
      } = { date };

      stocksData.forEach(stock => {
        const point = stock.data.find(d => d.date === date);
        if (point && initialPrices[stock.symbol]) {
          const initialPrice = initialPrices[stock.symbol];
          // Store both percentage change and original price
          const percentageChange = ((point.closePrice - initialPrice) / initialPrice) * 100;
          dataPoint[`${stock.symbol}_change`] = percentageChange;
          dataPoint[`${stock.symbol}_price`] = point.closePrice;
        }
      });

      return dataPoint;
    });
  }, [stocksData]);

  if (!stocksData.length) {
    return null;
  }

  return (
    <Card className="w-full mt-4">
      <CardHeader className="flex flex-wrap gap-2">
        <div className="flex-1">
          <h4 className="text-lg font-semibold">Stock Price Comparison</h4>
          <p className="text-sm text-default-500">
            Percentage change from first day
          </p>
        </div>
        <ButtonGroup size="sm" variant="flat">
          {stocksData.map((stock, index) => (
            <Button
              key={stock.symbol}
              className="min-w-[100px]"
              endContent={
                <CloseIcon
                  className="w-4 h-4 cursor-pointer hover:text-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveStock(stock.symbol);
                  }}
                />
              }
              style={{
                borderColor: STOCK_COLORS[index % STOCK_COLORS.length],
                color: STOCK_COLORS[index % STOCK_COLORS.length]
              }}
            >
              {stock.symbol}
            </Button>
          ))}
        </ButtonGroup>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: 'Change (%)',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip content={<ComparisonTooltip />} />
            <Legend />
            {stocksData.map((stock, index) => (
              <Line
                key={stock.symbol}
                type="monotone"
                dataKey={`${stock.symbol}_change`}
                stroke={STOCK_COLORS[index % STOCK_COLORS.length]}
                name={stock.symbol}
                dot={false}
                strokeWidth={2}
                activeDot={{ r: 6, stroke: STOCK_COLORS[index % STOCK_COLORS.length], strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};

export default ComparisonChart;