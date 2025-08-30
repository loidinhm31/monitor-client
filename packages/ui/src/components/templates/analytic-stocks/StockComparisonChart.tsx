import { X as CloseIcon } from "lucide-react";
import React from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ComparisonTooltip from "@repo/ui/components/organisms/ComparisonTooltip";
import { Card, CardHeader, CardContent } from "@repo/ui/components/atoms/card";
import { Button } from "@repo/ui/components/atoms/button";

const STOCK_COLORS = [
  "#0072F5", // Blue
  "#17C964", // Green
  "#F5A524", // Yellow
  "#F31260", // Red
  "#7828C8", // Purple
  "#00B8D9", // Cyan
];

interface StockData {
  date: string;
  closePrice: number;
}

interface ComparisonChartProps {
  stocksData: {
    symbol: string;
    data: StockData[];
  }[];
  onRemoveStock?: (symbol: string) => void;
  title?: string;
  description?: string;
  className?: string;
  hideRemoveButton?: boolean;
}

const StockComparisonChart: React.FC<ComparisonChartProps> = ({
  stocksData,
  onRemoveStock,
  title = "Stock Price Comparison",
  description = "Percentage change from first day",
  className = "",
  hideRemoveButton = false,
}) => {
  const normalizedData = React.useMemo(() => {
    if (!stocksData.length) return [];

    // Sort each stock's data by date
    const processedStockData = stocksData.map((stock) => ({
      ...stock,
      data: [...stock.data].sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));

        return dateA.getTime() - dateB.getTime();
      }),
    }));

    // Find common date range
    let latestStart = new Date(0);
    let earliestEnd = new Date(8640000000000000);

    processedStockData.forEach((stock) => {
      if (stock.data.length > 0) {
        const stockStart = new Date(stock.data[0].date.split("/").reverse().join("-"));
        const stockEnd = new Date(stock.data[stock.data.length - 1].date.split("/").reverse().join("-"));

        if (stockStart > latestStart) latestStart = stockStart;
        if (stockEnd < earliestEnd) earliestEnd = stockEnd;
      }
    });

    // Get all dates within common range
    const allDates = new Set<string>();

    processedStockData.forEach((stock) => {
      stock.data.forEach((point) => {
        const currentDate = new Date(point.date.split("/").reverse().join("-"));

        if (currentDate >= latestStart && currentDate <= earliestEnd) {
          allDates.add(point.date);
        }
      });
    });

    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = new Date(a.split("/").reverse().join("-"));
      const dateB = new Date(b.split("/").reverse().join("-"));

      return dateA.getTime() - dateB.getTime();
    });

    // Calculate baseline prices
    const earliestCommonDate = sortedDates[0];
    const baselinePrices: Record<string, number> = {};

    processedStockData.forEach((stock) => {
      const firstPoint = stock.data.find((d) => d.date === earliestCommonDate);

      if (firstPoint) {
        baselinePrices[stock.symbol] = firstPoint.closePrice;
      }
    });

    // Create normalized data points
    return sortedDates.map((date) => {
      const dataPoint: { date: string; [key: string]: any } = { date };

      processedStockData.forEach((stock) => {
        const point = stock.data.find((d) => d.date === date);

        if (point && baselinePrices[stock.symbol]) {
          const baselinePrice = baselinePrices[stock.symbol];
          const percentageChange = ((point.closePrice - baselinePrice) / baselinePrice) * 100;

          dataPoint[`${stock.symbol}_change`] = date === earliestCommonDate ? 0 : percentageChange;
          dataPoint[`${stock.symbol}_price`] = point.closePrice;
        }
      });

      return dataPoint;
    });
  }, [stocksData]);

  if (!stocksData.length) return null;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-wrap gap-2">
        <div className="flex-1">
          <h4 className="text-lg font-semibold">{title}</h4>
          <p className="text-sm text-default-500">{description}</p>
        </div>
        {!hideRemoveButton && (
          <div className="flex flex-wrap gap-2">
            {stocksData.map((stock, index) => (
              <Button
                key={stock.symbol}
                className="min-w-[100px]"
                variant="outline"
                style={{
                  borderColor: STOCK_COLORS[index % STOCK_COLORS.length],
                  color: STOCK_COLORS[index % STOCK_COLORS.length],
                }}
              >
                {stock.symbol}
                {onRemoveStock && (
                  <CloseIcon
                    className="w-4 h-4 cursor-pointer hover:text-red-500 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStock(stock.symbol);
                    }}
                  />
                )}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer height={400} width="100%">
          <LineChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis angle={-45} dataKey="date" height={60} textAnchor="end" tick={{ fontSize: 12 }} />
            <YAxis
              label={{
                value: "Change (%)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<ComparisonTooltip />} />
            <Legend />
            {stocksData.map((stock, index) => (
              <Line
                key={stock.symbol}
                activeDot={{ r: 6, stroke: STOCK_COLORS[index % STOCK_COLORS.length], strokeWidth: 2 }}
                dataKey={`${stock.symbol}_change`}
                dot={false}
                name={stock.symbol}
                stroke={STOCK_COLORS[index % STOCK_COLORS.length]}
                strokeWidth={2}
                type="monotone"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StockComparisonChart;
