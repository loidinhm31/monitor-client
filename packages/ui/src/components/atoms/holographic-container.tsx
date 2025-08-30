import React from "react";
import { Card, CardProps } from "@repo/ui/components/atoms/card";
import { cn } from "@repo/ui/lib/utils";

interface HolographicContainerProps extends Omit<CardProps, "variant"> {
  variant?: "default" | "dark" | "glass" | "liquid";
  delay?: number;
}

const HolographicContainer: React.FC<HolographicContainerProps> = ({
  children,
  className = "",
  variant = "default",
  delay = 0,
  ...props
}) => {
  const cardVariant = variant === "default" ? "holographic" : variant === "dark" ? "glass" : variant;

  return (
    <Card
      variant={cardVariant as any}
      animated
      className={cn(
        // Animation delay
        delay > 0 && `animate-delay-${delay}`,
        className,
      )}
      style={{
        animationDelay: delay > 0 ? `${delay}ms` : undefined,
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

export default HolographicContainer;