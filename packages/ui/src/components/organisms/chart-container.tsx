import React, { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CustomTooltip from "@repo/ui/components/organisms/CustomTooltip";
import { Indicators } from "@repo/ui/components/templates/analytic-stocks/indicator-controls";
import { ZoomableContainer } from "@repo/ui/components/organisms/zoomable-container";
import { ChartData } from "@repo/ui/types/stock";
import { Card, CardContent, CardHeader } from "@repo/ui/components/atoms/card";

interface EnhancedChartProps {
  data: ChartData[];
  indicators: Indicators;
}

const ChartContainer: React.FC<EnhancedChartProps> = ({ data = [], indicators }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState("portrait");

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const getMobileConfig = () => {
    const isPortrait = orientation === "portrait";

    return {
      height: isPortrait ? 300 : 200,
      fontSize: 10,
      strokeWidth: 1.5,
      dotSize: 3,
      margin: { top: 10, right: 10, left: 0, bottom: 10 },
      legendHeight: 36,
    };
  };

  const getDesktopConfig = () => ({
    height: 400,
    fontSize: 12,
    strokeWidth: 2,
    dotSize: 4,
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
    legendHeight: 50,
  });

  const config = isMobile ? getMobileConfig() : getDesktopConfig();

  const renderChart = (displayData: ChartData[]) => (
    <ResponsiveContainer height={config.height} width="100%">
      <ComposedChart data={displayData} margin={config.margin}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
        <XAxis
          angle={isMobile ? -90 : -45}
          dataKey="date"
          height={60}
          interval={isMobile ? "preserveStartEnd" : "equidistantPreserveStart"}
          padding={{ left: 10, right: 10 }}
          textAnchor="end"
          tick={{ fontSize: config.fontSize }}
        />

        {/* Price Scale */}
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: config.fontSize }} yAxisId="price" />

        {/* RSI Scale */}
        {indicators.rsi && (
          <YAxis domain={[0, 100]} orientation="right" tick={{ fontSize: config.fontSize }} yAxisId="rsi" />
        )}

        {/* MACD Scale */}
        {indicators.macd && <YAxis orientation="right" tick={{ fontSize: config.fontSize }} yAxisId="macd" />}

        {/* Volume Scale */}
        {indicators.volume && <YAxis orientation="right" tick={{ fontSize: config.fontSize }} yAxisId="volume" />}

        <Tooltip content={<CustomTooltip />} />
        <Legend height={config.legendHeight} iconSize={config.dotSize * 2} />

        {/* Main Price Line */}
        <Line
          dataKey="closePrice"
          dot={false}
          name="Close Price"
          stroke="#0072F5"
          strokeWidth={config.strokeWidth}
          type="monotone"
          yAxisId="price"
        />

        {/* Pivot Points */}
        {indicators.pivotPoints && (
          <>
            <Line
              dataKey="pp"
              dot={false}
              name="Pivot Point"
              stroke="#9333EA"
              strokeDasharray="3 3"
              strokeWidth={config.strokeWidth}
              type="monotone"
              yAxisId="price"
            />
            <Line
              dataKey="r1"
              dot={false}
              name="R1"
              stroke="#F43F5E"
              strokeDasharray="2 2"
              strokeWidth={config.strokeWidth}
              type="monotone"
              yAxisId="price"
            />
            <Line
              dataKey="s1"
              dot={false}
              name="S1"
              stroke="#10B981"
              strokeDasharray="2 2"
              strokeWidth={config.strokeWidth}
              type="monotone"
              yAxisId="price"
            />
          </>
        )}

        {/* High/Low Lines */}
        {indicators.highLow && (
          <>
            <Line
              dataKey="highestPrice"
              dot={false}
              name="High"
              stroke="#17C964"
              strokeDasharray="3 3"
              strokeWidth={config.strokeWidth}
              type="monotone"
              yAxisId="price"
            />
            <Line
              dataKey="lowestPrice"
              dot={false}
              name="Low"
              stroke="#F31260"
              strokeDasharray="3 3"
              strokeWidth={config.strokeWidth}
              type="monotone"
              yAxisId="price"
            />
          </>
        )}

        {/* Moving Averages */}
        {indicators.sma && (
          <Line
            dataKey="sma"
            dot={false}
            name="SMA (20)"
            stroke="#F5A524"
            strokeWidth={config.strokeWidth}
            type="monotone"
            yAxisId="price"
          />
        )}

        {indicators.ema && (
          <Line
            dataKey="ema"
            dot={false}
            name="EMA (20)"
            stroke="#17C964"
            strokeWidth={config.strokeWidth}
            type="monotone"
            yAxisId="price"
          />
        )}

        {/* MACD Lines */}
        {indicators.macd && (
          <>
            <Line
              dataKey="macd"
              dot={false}
              name="MACD"
              stroke="#0072F5"
              strokeWidth={config.strokeWidth}
              type="monotone"
              yAxisId="macd"
            />
            <Line
              dataKey="signal"
              dot={false}
              name="Signal"
              stroke="#F31260"
              strokeWidth={config.strokeWidth}
              type="monotone"
              yAxisId="macd"
            />
            <Bar dataKey="histogram" fill="#7828C8" name="MACD Histogram" opacity={0.3} yAxisId="macd" />
          </>
        )}

        {/* RSI Line */}
        {indicators.rsi && (
          <Line
            dataKey="rsi"
            dot={false}
            name="RSI"
            stroke="#7828C8"
            strokeWidth={config.strokeWidth}
            type="monotone"
            yAxisId="rsi"
          />
        )}

        {/* Volume Bar */}
        {indicators.volume && <Bar dataKey="volume" fill="#7828C8" name="Volume" opacity={0.3} yAxisId="volume" />}
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <Card className="w-full mt-4" variant="holographic">
      <CardContent>
        <ZoomableContainer data={data}>{(displayData) => renderChart(displayData)}</ZoomableContainer>
      </CardContent>
    </Card>
  );
};

export default ChartContainer;
