import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin rounded-full border-2 border-current border-t-transparent", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
    variant: {
      default: "text-primary",
      secondary: "text-secondary",
      muted: "text-muted-foreground",
      liquid: "text-liquid-500",
      rainbow:
        "border-2 border-transparent bg-gradient-to-r from-liquid-500 via-dream-500 to-liquid-600 rounded-full animate-spin",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof spinnerVariants> {
  label?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(({ className, size, variant, label, ...props }, ref) => {
  if (variant === "rainbow") {
    return (
      <div ref={ref} className="relative" {...props}>
        <div
          className={cn(
            spinnerVariants({ size }),
            "bg-gradient-to-r from-liquid-500 via-dream-500 to-liquid-600",
            className,
          )}
        >
          <div
            className={cn("rounded-full bg-background", {
              "h-3 w-3 m-0.5": size === "sm",
              "h-5 w-5 m-0.5": size === "md",
              "h-7 w-7 m-0.5": size === "lg",
              "h-11 w-11 m-0.5": size === "xl",
            })}
          />
        </div>
        {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
      </div>
    );
  }

  return (
    <div ref={ref} className="flex items-center" {...props}>
      <div className={cn(spinnerVariants({ size, variant }), className)} />
      {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
    </div>
  );
});

Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };
