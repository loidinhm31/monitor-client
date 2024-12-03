import React, { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CustomTooltip from "@/components/organisms/CustomTooltip";
import { Indicators } from "@/components/organisms/IndicatorControls";
import { ZoomableContainer } from "@/components/organisms/ZoomableContainer";
import { ChartData } from "@/types/stock";

interface ChartContainerProps {
  data: ChartData[];
  selectedTab: string;
  indicators: Indicators;
}

const EnhancedChartContainer: React.FC<ChartContainerProps> = ({ data, selectedTab, indicators }) => {
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleMouseDown = (e: any) => {
    if (e.activeLabel) {
      setRefAreaLeft(e.activeLabel);
      setIsSelecting(true);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isSelecting && e.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setIsSelecting(false);
  };

  const renderChart = (displayData: ChartData[]) => {
    if (selectedTab === "price") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={displayData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" />

            {indicators.pivotPoints && (
              <>
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pp"
                  stroke="#9333EA"
                  name="Pivot Point"
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="r1"
                  stroke="#F43F5E"
                  name="R1"
                  dot={false}
                  strokeDasharray="2 2"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="s1"
                  stroke="#10B981"
                  name="S1"
                  dot={false}
                  strokeDasharray="2 2"
                />
              </>
            )}

            {indicators.highLow && (
              <>
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="highestPrice"
                  stroke="#17C964"
                  name="High"
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="lowestPrice"
                  stroke="#F31260"
                  name="Low"
                  dot={false}
                  strokeDasharray="3 3"
                />
              </>
            )}

            {indicators.volume && <YAxis yAxisId="right" orientation="right" />}
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="closePrice" stroke="#0072F5" name="Close Price" dot={false} />
            {indicators.sma && (
              <Line yAxisId="left" type="monotone" dataKey="sma" stroke="#F5A524" name="SMA (20)" dot={false} />
            )}
            {indicators.ema && (
              <Line yAxisId="left" type="monotone" dataKey="ema" stroke="#17C964" name="EMA (20)" dot={false} />
            )}
            {indicators.volume && <Bar yAxisId="right" dataKey="volume" fill="#7828C8" name="Volume" opacity={0.3} />}
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="hsl(var(--foreground))"
                fillOpacity={0.05}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    if (selectedTab === "macd" && indicators.macd) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={displayData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#666" />
            <Line type="monotone" dataKey="macd" stroke="#0072F5" name="MACD" dot={false} />
            <Line type="monotone" dataKey="signal" stroke="#F31260" name="Signal" dot={false} />
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="hsl(var(--foreground))"
                fillOpacity={0.05}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    if (selectedTab === "rsi" && indicators.rsi) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={displayData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={70} stroke="#F31260" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#17C964" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="rsi" stroke="#7828C8" name="RSI" dot={false} />
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="hsl(var(--foreground))"
                fillOpacity={0.05}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return <ZoomableContainer data={data}>{(displayData) => renderChart(displayData)}</ZoomableContainer>;
};

export default EnhancedChartContainer;
