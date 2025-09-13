import React from "react";
import { TooltipProps } from "recharts";

interface CustomTooltipProps extends TooltipProps<any, any> {
  resolution?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, resolution = "1D" }) => {
  if (!active || !payload || !payload.length) return null;

  const isIntraday = ["1", "5", "15", "30", "60"].includes(resolution);

  const formatTooltipLabel = (label: any) => {
    if (!label) return "";

    // If we have the original dateObj, use it for better formatting
    const data = payload[0]?.payload;

    if (data?.dateObj) {
      const date = new Date(data.dateObj);

      if (isIntraday) {
        // Show full date and time for intraday
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");

        return `${day}/${month} ${hours}:${minutes}`;
      }
    }

    return label;
  };

  return (
    <div className="bg-slate-800/95 border border-cyan-400/30 rounded-lg p-3 shadow-lg backdrop-blur-sm">
      <p className="text-cyan-400 font-medium mb-2">{formatTooltipLabel(label)}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

export default CustomTooltip;
