// import type { ChartData, TimeframeOption, TransformedStockData } from "@/types/stock";
//
// import { Card, CardBody, CardHeader, Spinner, Tab, Tabs } from "@heroui/react";
// import React, { useEffect, useMemo, useState } from "react";
//
// import EnhancedChartContainer from "@/components/organisms/ChartContainer";
// import IndicatorControls, { Indicators } from "@/components/organisms/IndicatorControls";
// import ResponsiveDataTable from "@/components/templates/Analytics/ResponsiveDataTable";
// import StockComparison from "@/components/templates/Analytics/StockComparison";
// import { filterDataByTimeframe } from "@/utils/stockUtils";
// import {
//   calculateDailyPivotPoints,
//   calculateEMA,
//   calculateMACD,
//   calculateRSI,
//   calculateSMA,
// } from "@/utils/technicalIndicators";
//
// interface StockDashboardProps {
//   stockData: TransformedStockData[];
//   compareStocksData: Record<string, TransformedStockData[]>;
//   symbol: string;
//   onAddCompareStock: (symbol: string) => void;
//   onRemoveCompareStock: (symbol: string) => void;
//   timeframe: TimeframeOption;
// }
//
// const StockDashboard: React.FC<StockDashboardProps> = ({
//   stockData,
//   compareStocksData,
//   symbol,
//   onAddCompareStock,
//   onRemoveCompareStock,
//   timeframe,
// }) => {
//   const [loading, setLoading] = useState(true);
//   const [selectedTab, setSelectedTab] = useState("price");
//   const [indicators, setIndicators] = useState<Indicators>({
//     sma: false,
//     ema: false,
//     macd: false,
//     rsi: false,
//     volume: false,
//     highLow: false,
//     pivotPoints: false,
//   });
//
//   // Memoize the enriched data calculation
//   const enrichedData = useMemo(() => {
//     try {
//       const sortedData = [...stockData].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
//       const prices = sortedData.map((d) => d.closePrice);
//       const smaData = calculateSMA(prices, 20);
//       const emaData = calculateEMA(prices, 20);
//       const macdData = calculateMACD(prices);
//       const rsiData = calculateRSI(prices);
//       const pivotPointsData = calculateDailyPivotPoints(sortedData);
//
//       return sortedData.map((item, index) => ({
//         ...item,
//         sma: smaData[index],
//         ema: emaData[index],
//         macd: macdData.macd[index],
//         signal: macdData.signal[index],
//         histogram: macdData.histogram[index],
//         rsi: rsiData[index],
//         ...(pivotPointsData[index] || {}),
//       })) as ChartData[];
//     } catch (error) {
//       console.error("Error enriching data:", error);
//
//       return [] as ChartData[];
//     }
//   }, [stockData]);
//
//   // Memoize filtered data
//   const filteredData = useMemo(() => filterDataByTimeframe(enrichedData, timeframe), [enrichedData, timeframe]);
//
//   // Memoize table data (reverse chronological order)
//   const tableData = useMemo(
//     () => [...filteredData].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()),
//     [filteredData],
//   );
//
//   const comparisonData = useMemo(() => {
//     const mainStockData = {
//       symbol,
//       data: filteredData.map((d) => ({
//         date: d.date,
//         closePrice: d.closePrice,
//       })),
//     };
//
//     const compareStocks = Object.entries(compareStocksData).map(([compareSymbol, data]) => ({
//       symbol: compareSymbol,
//       data: filterDataByTimeframe(data, timeframe).map((d) => ({
//         date: d.date,
//         closePrice: d.closePrice,
//       })),
//     }));
//
//     return [mainStockData, ...compareStocks];
//   }, [symbol, filteredData, compareStocksData, timeframe]);
//
//   useEffect(() => {
//     setLoading(false);
//   }, [enrichedData]);
//
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Spinner size="lg" />
//       </div>
//     );
//   }
//
//   return (
//     <div className="w-full mx-auto">
//       <Card className="w-full">
//         <CardHeader className="flex flex-col sm:flex-row gap-4 px-6 py-4">
//           <div className="w-full">
//             <h4 className="text-xl font-bold">Stock Market Analysis</h4>
//             <p className="text-sm text-default-500">Technical analysis and comparison tools</p>
//           </div>
//         </CardHeader>
//         <CardBody>
//           <IndicatorControls indicators={indicators} onIndicatorChange={setIndicators} />
//
//           <Tabs
//             aria-label="Stock data views"
//             className="mb-4"
//             selectedKey={selectedTab}
//             variant="underlined"
//             onSelectionChange={(key) => setSelectedTab(key.toString())}
//           >
//             <Tab key="price" title="Price">
//               <EnhancedChartContainer data={filteredData} indicators={indicators} />
//             </Tab>
//
//             <Tab key="compare" title="Compare">
//               <StockComparison
//                 mainSymbol={symbol}
//                 stocksData={comparisonData}
//                 onAddStock={onAddCompareStock}
//                 onRemoveStock={onRemoveCompareStock}
//               />
//             </Tab>
//
//             <Tab key="table" isDisabled={filteredData.length === 0} title="Data Table">
//               <ResponsiveDataTable data={tableData} />
//             </Tab>
//           </Tabs>
//         </CardBody>
//       </Card>
//
//       <div className="py-2 text-sm text-gray-500">
//         <p>* SMA: Simple Moving Average (20 periods)</p>
//         <p>* EMA: Exponential Moving Average (20 periods)</p>
//         <p>* MACD: Moving Average Convergence Divergence (12, 26, 9)</p>
//         <p>* RSI: Relative Strength Index (14 periods)</p>
//         <p>* PP: Pivot Points (Classic) with Support (S1) and Resistance (R1) levels</p>
//       </div>
//     </div>
//   );
// };
//
// export default StockDashboard;
