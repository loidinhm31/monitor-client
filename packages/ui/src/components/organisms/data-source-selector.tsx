import React, { useCallback, useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/atoms/select";
import { Badge } from "@repo/ui/components/atoms/badge";
import { Button } from "@repo/ui/components/atoms/button";
import { AlertTriangle, CheckCircle, Info, RefreshCw, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/atoms/tooltip";
import { DataSource, stockDataSourceManager } from "@repo/ui/lib/data-sources/stock-data-source-manager";

interface DataSourceSelectorProps {
  currentSource: DataSource;
  onSourceChange: (source: DataSource) => void;
  showHealthStatus?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  currentSource,
  onSourceChange,
  showHealthStatus = true,
  disabled = false,
  className = "",
}) => {
  const [healthStatus, setHealthStatus] = useState<Partial<Record<DataSource, boolean>>>({});
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [sourceErrors, setSourceErrors] = useState<Partial<Record<DataSource, Error | null>>>({});

  const availableSources = stockDataSourceManager.getAvailableSources();

  const checkHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const [status, errors] = await Promise.all([
        stockDataSourceManager.healthCheckAll(),
        Promise.resolve(stockDataSourceManager.getSourceErrors()),
      ]);

      setHealthStatus(status);
      setSourceErrors(errors);
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  // Auto health check on mount and periodically
  useEffect(() => {
    if (showHealthStatus) {
      checkHealth();
      const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [showHealthStatus, checkHealth]);

  const getHealthIcon = (source: DataSource) => {
    if (checkingHealth) {
      return <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />;
    }

    if (healthStatus[source] === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (healthStatus[source] === false) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSourceDescription = (source: DataSource) => {
    const descriptions = {
      VNDIRECT: "VNDIRECT Securities - D-Board API",
      SSI: "SSI Securities - iBoard API ",
    };

    return descriptions[source];
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Select disabled={disabled} value={currentSource} onValueChange={(value: DataSource) => onSourceChange(value)}>
          <SelectTrigger className="w-48" variant="holographic">
            <SelectValue placeholder="Select data source" />
          </SelectTrigger>
          <SelectContent variant="holographic">
            {availableSources.map((source) => (
              <SelectItem key={source.name} value={source.name} variant="holographic">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span>{source.displayName}</span>
                    {showHealthStatus && getHealthIcon(source.name)}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Badge
                      className="text-xs"
                      variant={source.priority === 1 ? "holographic" : "holographic-secondary"}
                    >
                      {source.priority === 1 ? "Primary" : "Secondary"}
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showHealthStatus && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={checkingHealth} size="sm" variant="default" onClick={checkHealth}>
                  <RefreshCw className={`w-4 h-4 ${checkingHealth ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent variant="holographic">
                <p>Check data source health</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Badge
                    className="text-xs"
                    variant={healthStatus[currentSource] === true ? "holographic" : "holographic-destructive"}
                  >
                    {currentSource}
                  </Badge>
                  {!healthStatus[currentSource] && sourceErrors[currentSource] && (
                    <Info className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent variant="holographic">
                <div className="space-y-1">
                  <p>{getSourceDescription(currentSource)}</p>
                  {!healthStatus[currentSource] && sourceErrors[currentSource] && (
                    <p className="text-red-500 text-xs">Error: {sourceErrors[currentSource]?.message}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
