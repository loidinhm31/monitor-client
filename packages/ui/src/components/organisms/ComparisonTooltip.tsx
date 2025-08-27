import React from "react";
import { TooltipProps } from "recharts";

interface ComparisonTooltipPayload {
  value: number;
  name: string;
  color: string;
  dataKey: string;
  payload: {
    date: string;
    [key: string]: any;
  };
}

interface ComparisonTooltipProps extends TooltipProps<any, string> {
  payload?: ComparisonTooltipPayload[];
}

const ComparisonTooltip: React.FC<ComparisonTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const entries = payload.map((entry) => {
    const symbol = entry.name;
    const percentageChange = entry.value;
    const priceKey = entry.dataKey.replace("_change", "_price");
    const price = entry.payload[priceKey];

    return {
      symbol,
      percentageChange,
      price,
      color: entry.color,
    };
  });

  return (
    <div className="rounded-lg shadow-lg bg-content1 border border-divider p-3">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {entries
          .sort((a, b) => b.percentageChange - a.percentageChange)
          .map((entry) => (
            <div key={entry.symbol} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-foreground-600">{entry.symbol}</span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-sm font-medium ${
                    entry.percentageChange > 0
                      ? "text-success"
                      : entry.percentageChange < 0
                        ? "text-danger"
                        : "text-foreground"
                  }`}
                >
                  {entry.percentageChange.toFixed(2)}%
                </span>
                <span className="text-xs text-foreground-500">
                  {entry.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ComparisonTooltip;
