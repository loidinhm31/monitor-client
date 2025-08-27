import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "text-foreground",
        liquid: "text-foreground hover:text-liquid-600 dark:hover:text-liquid-400",
        muted: "text-muted-foreground",
        gradient: "bg-gradient-to-r from-liquid-600 to-dream-600 bg-clip-text text-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, variant, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ variant }), className)} {...props} />
  ),
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label, labelVariants };
