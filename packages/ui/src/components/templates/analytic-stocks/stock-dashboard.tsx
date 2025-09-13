import type { ChartData, ResolutionOption, TimeframeOption, TransformedStockData } from "@repo/ui/types/stock";

import { Card, CardContent, CardHeader } from "@repo/ui/components/atoms/card";
import { Spinner } from "@repo/ui/components/atoms/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/atoms/tabs";
import React, { useEffect, useMemo, useState } from "react";
import ChartContainer from "@repo/ui/components/organisms/chart-container";
import ResponsiveDataTable from "@repo/ui/components/templates/analytic-stocks/ResponsiveDataTable";
import StockComparison from "@repo/ui/components/templates/analytic-stocks/stock-comparison";
import { filterDataByTimeframe } from "@repo/ui/lib/stock-utils";
import {
  calculateDailyPivotPoints,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
} from "@repo/ui/lib/technical-indicators";
import IndicatorControls, { Indicators } from "@repo/ui/components/templates/analytic-stocks/indicator-controls";

interface StockDashboardProps {
  stockData: TransformedStockData[];
  compareStocksData: Record<string, TransformedStockData[]>;
  symbol: string;
  onAddCompareStock: (symbol: string) => void;
  onRemoveCompareStock: (symbol: string) => void;
  timeframe: TimeframeOption;
  resolution: ResolutionOption;
}

const StockDashboard: React.FC<StockDashboardProps> = ({
  stockData,
  compareStocksData,
  symbol,
  onAddCompareStock,
  onRemoveCompareStock,
  timeframe,
  resolution,
}) => {
  const [indicators, setIndicators] = useState<Indicators>({
    sma: false,
    ema: false,
    rsi: false,
    macd: false,
    volume: false,
    highLow: false,
    pivotPoints: false,
  });

  const [loading, setLoading] = useState(false);

  // Check if current symbol is Vietnamese Gold
  const isVNGold = symbol === "VNGOLD";

  // Filter data by timeframe
  const filteredData = useMemo(() => {
    if (!stockData?.length) return [];

    return filterDataByTimeframe(stockData, timeframe);
  }, [stockData, timeframe]);

  // Apply technical indicators to filtered data - following the pattern from tabbed-analytics.tsx
  const enrichedData = useMemo((): ChartData[] => {
    if (!filteredData?.length) return [];

    try {
      const sortedData = [...filteredData].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      const prices = sortedData.map((d) => d.closePrice);

      // Calculate technical indicators
      const smaData = calculateSMA(prices, 20);
      const emaData = calculateEMA(prices, 20);
      const macdData = calculateMACD(prices);
      const rsiData = calculateRSI(prices);
      const pivotPointsData = indicators.pivotPoints ? calculateDailyPivotPoints(sortedData) : sortedData;

      return sortedData.map((item, index) => ({
        ...item,
        sma: smaData[index],
        ema: emaData[index],
        macd: macdData.macd[index],
        signal: macdData.signal[index],
        histogram: macdData.histogram[index],
        rsi: rsiData[index],
        ...(indicators.pivotPoints ? pivotPointsData[index] : {}),
      })) as ChartData[];
    } catch (error) {
      console.error("Error enriching data:", error);

      return [] as ChartData[];
    }
  }, [filteredData, indicators.pivotPoints]);

  useEffect(() => {
    setLoading(false);
  }, [enrichedData]);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    const mainStockData = {
      symbol,
      data: filteredData.map((d) => ({
        date: d.date,
        closePrice: d.closePrice,
      })),
    };

    const compareStocks = Object.entries(compareStocksData).map(([compareSymbol, data]) => ({
      symbol: compareSymbol,
      data: filterDataByTimeframe(data, timeframe).map((d) => ({
        date: d.date,
        closePrice: d.closePrice,
      })),
    }));

    return [mainStockData, ...compareStocks];
  }, [symbol, filteredData, compareStocksData, timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!stockData?.length) {
    return (
      <Card className="p-8 text-center" variant="holographic">
        <CardContent>
          <p className="text-cyan-400/70">
            {isVNGold ? "Enter VNGOLD to view Vietnamese Gold prices" : "Enter a stock symbol to view data"}
          </p>
          {isVNGold && (
            <p className="text-amber-400/70 text-sm mt-2">
              Vietnamese Gold data is sourced from SJC and supports daily resolution only
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs className="w-full" defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3" variant="holographic">
          <TabsTrigger value="overview" variant="holographic">
            {isVNGold ? "Gold Price Overview" : "Stock Overview"}
          </TabsTrigger>
          <TabsTrigger value="comparison" variant="holographic">
            Price Comparison
          </TabsTrigger>
          <TabsTrigger value="data" variant="holographic">
            Raw Data
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="overview">
          <div className="grid gap-4">
            {/* Technical Indicators Control - Hide for VN Gold as it's daily only */}
            <Card variant="holographic">
              <CardHeader>
                <h3 className="text-lg font-semibold font-mono text-cyan-400">Technical Analysis</h3>
              </CardHeader>
              <CardContent>
                <IndicatorControls indicators={indicators} isVNGold={isVNGold} onIndicatorChange={setIndicators} />
              </CardContent>
            </Card>

            {/* Price Chart */}
            <Card variant="holographic">
              <CardHeader>
                <h3 className="text-lg font-semibold font-mono text-cyan-400">
                  {isVNGold ? `Vietnamese Gold Price (${symbol})` : `${symbol} Price Chart`}
                </h3>
              </CardHeader>
              <CardContent>
                <ChartContainer data={enrichedData} indicators={indicators} resolution={resolution} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="comparison">
          <StockComparison
            mainSymbol={symbol}
            stocksData={comparisonData}
            onAddStock={onAddCompareStock}
            onRemoveStock={onRemoveCompareStock}
          />
        </TabsContent>

        <TabsContent className="space-y-4" value="data">
          <Card variant="holographic">
            <CardHeader>
              <h3 className="text-lg font-semibold text-cyan-400">{isVNGold ? "Gold Price Data" : "Stock Data"}</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveDataTable data={enrichedData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDashboard;
