import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const tooltipContentVariants = cva(
  "z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md",
        holographic: [
          "bg-black/90 backdrop-blur-md border border-cyan-400/30",
          "text-cyan-400 font-mono shadow-cyan-400/20 shadow-lg",
        ],
        "holographic-secondary": [
          "bg-black/90 backdrop-blur-md border border-slate-400/30",
          "text-slate-400 font-mono shadow-slate-400/20 shadow-lg",
        ],
        "holographic-destructive": [
          "bg-black/90 backdrop-blur-md border border-red-400/30",
          "text-red-400 font-mono shadow-red-400/20 shadow-lg",
        ],
        glass: ["bg-white/10 backdrop-blur-md border border-white/20", "text-white shadow-lg"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipContentVariants> {}

const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, TooltipContentProps>(
  ({ className, variant, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      className={cn(tooltipContentVariants({ variant }), className)}
      sideOffset={sideOffset}
      {...props}
    />
  ),
);

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, tooltipContentVariants };
