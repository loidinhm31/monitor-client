import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-500/80",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80",
        liquid:
          "border-transparent bg-gradient-to-r from-liquid-500 to-liquid-600 text-white shadow-liquid-sm hover:shadow-liquid-md",
        glass: "border border-white/20 bg-white/10 backdrop-blur-md text-foreground hover:bg-white/20",
        cloud: "border-transparent bg-gradient-to-r from-cloud-400 to-cloud-500 text-white shadow-liquid-sm",
        dream: "border-transparent bg-gradient-to-r from-dream-500 to-dream-600 text-white shadow-dream-glow",
        dot: "relative pl-6 bg-muted text-muted-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dotColor?: string;
}

function Badge({ className, variant, dotColor, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {variant === "dot" && (
        <span
          className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-current"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
