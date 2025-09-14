import React, { useCallback, useEffect, useState } from "react";
import { Badge } from "@repo/ui/components/atoms/badge";
import { Button } from "@repo/ui/components/atoms/button";
import { AlertTriangle, CheckCircle, Info, RefreshCw, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/atoms/tooltip";
import { stockDataSourceManager } from "@repo/ui/lib/data-sources/stock-data-source-manager";
import { DataSource, DataSourceOption } from "@repo/ui/types/stock";

interface DataSourceStatusProps {
  showDetails?: boolean;
  availableSources: DataSourceOption[];
}

export const DataSourceStatus: React.FC<DataSourceStatusProps> = ({ showDetails = false, availableSources }) => {
  const [healthStatus, setHealthStatus] = useState<Partial<Record<DataSource, boolean>>>({});
  const [sourceErrors, setSourceErrors] = useState<Partial<Record<DataSource, Error | null>>>({});
  const [loading, setLoading] = useState(false);

  const checkAllSources = useCallback(async () => {
    setLoading(true);
    try {
      const [status, errors] = await Promise.all([
        stockDataSourceManager.healthCheckAll(),
        Promise.resolve(stockDataSourceManager.getSourceErrors()),
      ]);

      setHealthStatus(status);
      setSourceErrors(errors);
    } catch (error) {
      console.error("Status check failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAllSources();
  }, [checkAllSources]);

  if (!showDetails) {
    const healthyCount = Object.values(healthStatus).filter(Boolean).length;
    const totalCount = availableSources?.length;

    return (
      <Badge variant={healthyCount === totalCount ? "holographic" : "holographic-destructive"}>
        {healthyCount}/{totalCount} Sources Online
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-cyan-400 font-medium">Data Source Status</h4>
        <Button disabled={loading} size="sm" variant="holographic" onClick={checkAllSources}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-1">
        {availableSources.map((source) => (
          <div key={source.name} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              {healthStatus[source.name] ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : !healthStatus[source.name] ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-cyan-400">{source.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={source.priority === 1 ? "holographic" : "holographic-secondary"}>
                Priority {source.priority}
              </Badge>
              {sourceErrors[source.name] && (
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{sourceErrors[source.name]?.message}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
