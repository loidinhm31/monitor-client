import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/atoms/select";
import { Label } from "@repo/ui/components/atoms/label";
import StatusIndicator from "@repo/ui/components/atoms/status-indicator";
import { Coins, Database } from "lucide-react";
import { DataSource } from "@repo/ui/lib/data-sources/stock-data-source-manager";

interface DataSourceOption {
  name: DataSource;
  displayName: string;
  enabled: boolean;
  priority: number;
}

interface DataSourceSelectorProps {
  currentSource: DataSource;
  availableSources: DataSourceOption[];
  onSourceChange: (source: DataSource) => void;
  disabled?: boolean;
  loading?: boolean;
  currentSymbol?: string;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  currentSource,
  availableSources,
  onSourceChange,
  disabled = false,
  loading = false,
  currentSymbol,
}) => {
  const isVNGold = currentSymbol === "VNGOLD";
  const isDisabled = disabled || loading || isVNGold;

  const getSourceIcon = (sourceName: DataSource) => {
    switch (sourceName) {
      case "VNGOLD":
        return <Coins className="w-4 h-4 text-amber-400" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getSourceStatus = (sourceName: DataSource) => {
    const source = availableSources.find((s) => s.name === sourceName);

    if (!source) return "offline";

    if (sourceName === "VNGOLD") {
      return "online"; // Assume VN Gold is always available if enabled
    }

    return source.enabled ? "online" : "offline";
  };

  return (
    <div className="flex-none w-64">
      <Label className="text-cyan-400/70 text-sm font-medium mb-2 block">
        Data Source
        {isVNGold && <span className="ml-2 text-xs text-amber-400/70">(Fixed: Vietnamese Gold)</span>}
      </Label>
      <Select disabled={isDisabled} value={currentSource} onValueChange={onSourceChange}>
        <SelectTrigger className={`w-full ${isVNGold ? "opacity-60 cursor-not-allowed" : ""}`} variant="holographic">
          {getSourceIcon(currentSource)}
          <SelectValue placeholder="Select source" />
          <StatusIndicator className="ml-2" status={getSourceStatus(currentSource)} />
        </SelectTrigger>
        <SelectContent variant="holographic">
          {availableSources.map((source) => (
            <SelectItem key={source.name} value={source.name}>
              <div className="flex items-center gap-2">
                {getSourceIcon(source.name)}
                <span>{source.displayName}</span>
                <StatusIndicator className="ml-auto" status={getSourceStatus(source.name)} />
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isVNGold && (
        <div className="flex items-center mt-1 text-xs text-amber-400/70">
          <Coins className="w-3 h-3 mr-1" />
          Vietnamese Gold uses dedicated SJC data source
        </div>
      )}
      {loading && <div className="text-xs text-cyan-400/70 mt-1">Updating data source...</div>}
    </div>
  );
};
