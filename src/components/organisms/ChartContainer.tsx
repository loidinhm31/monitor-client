import React, { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardBody } from "@nextui-org/react";
import CustomTooltip from "@/components/organisms/CustomTooltip";
import { Indicators } from "@/components/organisms/IndicatorControls";
import { ZoomableContainer } from "@/components/organisms/ZoomableContainer";
import { ChartData } from "@/types/stock";

interface ChartContainerProps {
  data: ChartData[];
  selectedTab: string;
  indicators: Indicators;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ data, selectedTab, indicators }) => {
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

  const renderPriceChart = (displayData: ChartData[]) => (
    <ResponsiveContainer width="100%" height={config.height}>
      <ComposedChart data={displayData} margin={config.margin}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: config.fontSize }}
          interval={isMobile ? "preserveStartEnd" : 0}
          angle={isMobile ? -90 : -45}
          textAnchor={isMobile ? "end" : "middle"}
          height={isMobile ? 50 : 30}
        />
        <YAxis tick={{ fontSize: config.fontSize }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          height={config.legendHeight}
          iconSize={config.dotSize * 2}
          wrapperStyle={{ fontSize: config.fontSize }}
        />

        <Line
          type="monotone"
          dataKey="closePrice"
          stroke="#0072F5"
          name="Close Price"
          dot={false}
          strokeWidth={config.strokeWidth}
        />

        {indicators.sma && (
          <Line
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
            type="monotone"
            dataKey="ema"
            stroke="#17C964"
            name="EMA (20)"
            dot={false}
            strokeWidth={config.strokeWidth}
          />
        )}

        {indicators.volume && <Bar dataKey="volume" fill="#7828C8" name="Volume" opacity={0.3} yAxisId="right" />}
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderMACDChart = (displayData: ChartData[]) => (
    <ResponsiveContainer width="100%" height={config.height}>
      <ComposedChart data={displayData} margin={config.margin}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: config.fontSize }}
          interval={isMobile ? "preserveStartEnd" : 0}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? "end" : "middle"}
          height={isMobile ? 50 : 30}
        />
        <YAxis tick={{ fontSize: config.fontSize }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          height={config.legendHeight}
          iconSize={config.dotSize * 2}
          wrapperStyle={{ fontSize: config.fontSize }}
        />
        <ReferenceLine y={0} stroke="#666" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="macd"
          stroke="#0072F5"
          name="MACD"
          dot={false}
          strokeWidth={config.strokeWidth}
        />
        <Line
          type="monotone"
          dataKey="signal"
          stroke="#F31260"
          name="Signal"
          dot={false}
          strokeWidth={config.strokeWidth}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderRSIChart = (displayData: ChartData[]) => (
    <ResponsiveContainer width="100%" height={config.height}>
      <ComposedChart data={displayData} margin={config.margin}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: config.fontSize }}
          interval={isMobile ? "preserveStartEnd" : 0}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? "end" : "middle"}
          height={isMobile ? 50 : 30}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: config.fontSize }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          height={config.legendHeight}
          iconSize={config.dotSize * 2}
          wrapperStyle={{ fontSize: config.fontSize }}
        />
        <ReferenceLine y={70} stroke="#F31260" strokeDasharray="3 3" />
        <ReferenceLine y={30} stroke="#17C964" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="rsi" stroke="#7828C8" name="RSI" dot={false} strokeWidth={config.strokeWidth} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <Card className="w-full mt-4">
      <CardBody>
        <ZoomableContainer data={data}>
          {(displayData) => {
            switch (selectedTab) {
              case "price":
                return renderPriceChart(displayData);
              case "macd":
                return indicators.macd ? renderMACDChart(displayData) : null;
              case "rsi":
                return indicators.rsi ? renderRSIChart(displayData) : null;
              default:
                return null;
            }
          }}
        </ZoomableContainer>
      </CardBody>
    </Card>
  );
};

export default ChartContainer;
