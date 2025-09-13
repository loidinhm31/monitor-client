import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@repo/ui/components/atoms/button";
import { cn } from "@repo/ui/lib/utils";

interface HudCircleProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

const HudCircle: React.FC<HudCircleProps> = ({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  className,
}) => {
  return (
    <Button
      animated
      aria-label={`${label} control`}
      className={cn(
        "flex-col gap-1 relative",
        // Rotating border effect for active state
        active && [
          "before:absolute before:inset-0 before:rounded-full",
          "before:border-2 before:border-transparent before:border-t-cyan-400",
          "before:animate-spin before:opacity-100",
        ],
        // Pulsing glow for active state
        active && "shadow-cyan-400/50 shadow-lg animate-pulse",
        className,
      )}
      disabled={disabled}
      size="hud"
      variant="hud"
      onClick={onClick}
    >
      <Icon className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
      <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider">{label}</span>
    </Button>
  );
};

export default HudCircle;
