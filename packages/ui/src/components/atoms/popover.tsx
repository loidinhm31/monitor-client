import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const popoverContentVariants = cva(
  "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "bg-black/90 backdrop-blur-md border-cyan-400/30",
          "shadow-cyan-400/20 shadow-xl text-cyan-400",
        ],
        "holographic-secondary": [
          "bg-black/90 backdrop-blur-md border-slate-400/30",
          "shadow-slate-400/20 shadow-xl text-slate-400",
        ],
        "holographic-destructive": [
          "bg-black/90 backdrop-blur-md border-red-400/30",
          "shadow-red-400/20 shadow-xl text-red-400",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md border-white/20",
          "shadow-lg text-white",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
    VariantProps<typeof popoverContentVariants> {}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, variant, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(popoverContentVariants({ variant }), className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, popoverContentVariants };