import React from "react";
import { Badge } from "@repo/ui/components/atoms/badge";
import { cn } from "@repo/ui/lib/utils";

interface EnhancedStatusIndicatorProps {
  status: "online" | "offline" | "warning" | "error";
  pulse?: boolean;
  label?: string;
  className?: string;
}

const StatusIndicator: React.FC<EnhancedStatusIndicatorProps> = ({ status, pulse = true, label, className }) => {
  const getVariantAndClasses = () => {
    switch (status) {
      case "online":
        return {
          variant: "success" as const,
          classes: pulse ? "animate-pulse" : "",
        };
      case "offline":
        return {
          variant: "secondary" as const,
          classes: "",
        };
      case "warning":
        return {
          variant: "warning" as const,
          classes: pulse ? "animate-pulse" : "",
        };
      case "error":
        return {
          variant: "danger" as const,
          classes: pulse ? "animate-pulse" : "",
        };
    }
  };

  const { variant, classes } = getVariantAndClasses();

  return (
    <Badge
      variant={variant}
      className={cn("inline-flex items-center gap-1", !label && "w-3 h-3 p-0 rounded-full", classes, className)}
    >
      {!label && <div className="w-2 h-2 rounded-full bg-current" />}
      {label}
    </Badge>
  );
};

export default StatusIndicator;
