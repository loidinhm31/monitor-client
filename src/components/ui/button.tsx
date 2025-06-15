import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-liquid-500 to-liquid-600 text-primary-foreground shadow-liquid-md hover:shadow-liquid-lg hover:scale-105 active:scale-95",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-destructive-foreground shadow-liquid-md hover:shadow-liquid-lg hover:scale-105 active:scale-95",
        outline:
          "border border-input bg-white/10 backdrop-blur-md hover:bg-white/20 hover:text-accent-foreground liquid-border",
        secondary:
          "bg-gradient-to-r from-cloud-400 to-cloud-500 text-secondary-foreground shadow-liquid-md hover:shadow-liquid-lg hover:scale-105 active:scale-95",
        ghost: "hover:bg-white/10 hover:text-accent-foreground backdrop-blur-md",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 shadow-glass text-foreground",
        liquid: "liquid-button relative overflow-hidden",
        cloud:
          "bg-gradient-to-r from-cloud-300 to-liquid-400 text-white shadow-cloud-glow hover:shadow-cloud-glow hover:scale-105 active:scale-95",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        xl: "h-14 rounded-2xl px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {variant === "liquid" && (
          <div className="absolute inset-0 bg-gradient-to-r from-dream-500 to-liquid-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
        <span className="relative z-10">{children}</span>
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
