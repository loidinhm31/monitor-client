import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        glass: [
          "border-white/20 bg-white/10 text-white backdrop-blur-md",
          "hover:bg-white/20",
        ],
        "glass-secondary": [
          "border-slate-400/20 bg-slate-400/10 text-slate-400 backdrop-blur-md",
          "hover:bg-slate-400/20",
        ],
        "glass-destructive": [
          "border-red-400/20 bg-red-400/10 text-red-400 backdrop-blur-md",
          "hover:bg-red-400/20",
        ],
        holographic: [
          "border-cyan-400/30 bg-cyan-400/10 text-cyan-400",
          "hover:bg-cyan-400/20 hover:shadow-cyan-400/40 hover:shadow-sm",
          "font-mono uppercase tracking-wider",
        ],
        "holographic-secondary": [
          "border-slate-400/30 bg-slate-400/10 text-slate-400",
          "hover:bg-slate-400/20 hover:shadow-slate-400/40 hover:shadow-sm",
          "font-mono uppercase tracking-wider",
        ],
        "holographic-destructive": [
          "border-red-400/30 bg-red-400/10 text-red-400",
          "hover:bg-red-400/20 hover:shadow-red-400/40 hover:shadow-sm",
          "font-mono uppercase tracking-wider",
        ],
        success: [
          "border-green-400/30 bg-green-400/10 text-green-400",
          "hover:bg-green-400/20",
        ],
        warning: [
          "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
          "hover:bg-yellow-400/20",
        ],
        danger: [
          "border-red-400/30 bg-red-400/10 text-red-400",
          "hover:bg-red-400/20",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
