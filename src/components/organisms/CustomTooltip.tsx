import React from 'react';
import { TooltipProps } from 'recharts';

interface CustomTooltipPayload {
  value: number | string;
  name: string;
  color: string;
}

// Using more specific types for the tooltip props
type CustomTooltipProps = TooltipProps<any, string> & {
  payload?: Array<CustomTooltipPayload>;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({
                                                       active,
                                                       payload,
                                                       label
                                                     }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg shadow-lg bg-content1 border border-divider p-3">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-foreground-600">
              {entry.name}: {typeof entry.value === 'number'
              ? entry.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
              : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomTooltip;