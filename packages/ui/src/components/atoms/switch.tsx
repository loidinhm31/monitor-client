import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const switchVariants = cva(
  "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-cyan-600",
          "data-[state=unchecked]:bg-cyan-400/20 data-[state=unchecked]:border-cyan-400/30",
          "data-[state=checked]:shadow-cyan-400/40 data-[state=checked]:shadow-lg",
        ],
        "holographic-secondary": [
          "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-slate-400 data-[state=checked]:to-slate-600",
          "data-[state=unchecked]:bg-slate-400/20 data-[state=unchecked]:border-slate-400/30",
          "data-[state=checked]:shadow-slate-400/40 data-[state=checked]:shadow-lg",
        ],
        "holographic-destructive": [
          "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-400 data-[state=checked]:to-red-600",
          "data-[state=unchecked]:bg-red-400/20 data-[state=unchecked]:border-red-400/30",
          "data-[state=checked]:shadow-red-400/40 data-[state=checked]:shadow-lg",
        ],
        glass: [
          "data-[state=checked]:bg-white/30 backdrop-blur-md",
          "data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/20",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, variant, ...props }, ref) => (
    <SwitchPrimitives.Root className={cn(switchVariants({ variant }), className)} {...props} ref={ref}>
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
          variant?.includes("holographic") && "bg-white shadow-lg",
          variant === "glass" && "bg-white/90",
        )}
      />
    </SwitchPrimitives.Root>
  ),
);

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch, switchVariants };
