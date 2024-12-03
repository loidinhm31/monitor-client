import { Card, CardBody } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import CustomTooltip from "@/components/organisms/CustomTooltip";
import { Indicators } from "@/components/organisms/IndicatorControls";
import { ZoomableContainer } from "@/components/organisms/ZoomableContainer";
import { ChartData } from "@/types/stock";

interface EnhancedChartProps {
  data: ChartData[];
  indicators: Indicators;
}

const EnhancedChartContainer: React.FC<EnhancedChartProps> = ({ data = [], indicators }) => {
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
    <ResponsiveContainer width="100%" height={config.height}>
      <ComposedChart data={displayData} margin={config.margin}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: config.fontSize }}
          interval={isMobile ? "preserveStartEnd" : "equidistantPreserveStart"}
          angle={isMobile ? -90 : -45}
          textAnchor="end"
          height={60}
          padding={{ left: 10, right: 10 }}
        />

        {/* Price Scale */}
        <YAxis yAxisId="price" tick={{ fontSize: config.fontSize }} domain={["auto", "auto"]} />

        {/* RSI Scale */}
        {indicators.rsi && (
          <YAxis yAxisId="rsi" orientation="right" domain={[0, 100]} tick={{ fontSize: config.fontSize }} />
        )}

        {/* MACD Scale */}
        {indicators.macd && <YAxis yAxisId="macd" orientation="right" tick={{ fontSize: config.fontSize }} />}

        {/* Volume Scale */}
        {indicators.volume && <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: config.fontSize }} />}

        <Tooltip content={<CustomTooltip />} />
        <Legend height={config.legendHeight} iconSize={config.dotSize * 2} />

        {/* Main Price Line */}
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="closePrice"
          stroke="#0072F5"
          name="Close Price"
          dot={false}
          strokeWidth={config.strokeWidth}
        />

        {/* Pivot Points */}
        {indicators.pivotPoints && (
          <>
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="pp"
              stroke="#9333EA"
              name="Pivot Point"
              dot={false}
              strokeDasharray="3 3"
              strokeWidth={config.strokeWidth}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="r1"
              stroke="#F43F5E"
              name="R1"
              dot={false}
              strokeDasharray="2 2"
              strokeWidth={config.strokeWidth}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="s1"
              stroke="#10B981"
              name="S1"
              dot={false}
              strokeDasharray="2 2"
              strokeWidth={config.strokeWidth}
            />
          </>
        )}

        {/* High/Low Lines */}
        {indicators.highLow && (
          <>
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="highestPrice"
              stroke="#17C964"
              name="High"
              dot={false}
              strokeDasharray="3 3"
              strokeWidth={config.strokeWidth}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="lowestPrice"
              stroke="#F31260"
              name="Low"
              dot={false}
              strokeDasharray="3 3"
              strokeWidth={config.strokeWidth}
            />
          </>
        )}

        {/* Moving Averages */}
        {indicators.sma && (
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="sma"
            stroke="#F5A524"
            name="SMA (20)"
            dot={false}
            strokeWidth={config.strokeWidth}
          />
        )}

        {indicators.ema && (
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="ema"
            stroke="#17C964"
            name="EMA (20)"
            dot={false}
            strokeWidth={config.strokeWidth}
          />
        )}

        {/* MACD Lines */}
        {indicators.macd && (
          <>
            <Line
              yAxisId="macd"
              type="monotone"
              dataKey="macd"
              stroke="#0072F5"
              name="MACD"
              dot={false}
              strokeWidth={config.strokeWidth}
            />
            <Line
              yAxisId="macd"
              type="monotone"
              dataKey="signal"
              stroke="#F31260"
              name="Signal"
              dot={false}
              strokeWidth={config.strokeWidth}
            />
            <Bar yAxisId="macd" dataKey="histogram" fill="#7828C8" name="MACD Histogram" opacity={0.3} />
          </>
        )}

        {/* RSI Line */}
        {indicators.rsi && (
          <Line
            yAxisId="rsi"
            type="monotone"
            dataKey="rsi"
            stroke="#7828C8"
            name="RSI"
            dot={false}
            strokeWidth={config.strokeWidth}
          />
        )}

        {/* Volume Bar */}
        {indicators.volume && <Bar yAxisId="volume" dataKey="volume" fill="#7828C8" name="Volume" opacity={0.3} />}
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <Card className="w-full mt-4">
      <CardBody>
        <ZoomableContainer data={data}>{(displayData) => renderChart(displayData)}</ZoomableContainer>
      </CardBody>
    </Card>
  );
};

export default EnhancedChartContainer;
