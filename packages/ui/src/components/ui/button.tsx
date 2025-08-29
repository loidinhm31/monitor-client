import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Enhanced holographic variants
        holographic: [
          "relative overflow-hidden font-mono uppercase tracking-wider",
          "bg-gradient-to-br from-cyan-400/10 to-cyan-600/10",
          "border border-cyan-400/50 text-cyan-400",
          "hover:shadow-cyan-400/40 hover:shadow-lg",
          "transition-all duration-300",
          "before:absolute before:inset-0 before:bg-gradient-to-r",
          "before:from-transparent before:via-white/10 before:to-transparent",
          "before:translate-x-[-100%] hover:before:translate-x-[100%]",
          "before:transition-transform before:duration-500",
        ],
        "holographic-danger": [
          "relative overflow-hidden font-mono uppercase tracking-wider",
          "bg-gradient-to-br from-red-400/10 to-red-600/10",
          "border border-red-400/50 text-red-400",
          "hover:shadow-red-400/40 hover:shadow-lg",
          "transition-all duration-300",
        ],
        hexagon: [
          "relative overflow-hidden text-center",
          "bg-gradient-to-br from-cyan-400/20 to-cyan-600/10",
          "border-2 border-cyan-400/60 text-cyan-400",
          "hover:shadow-cyan-400/40 hover:shadow-xl",
          "transition-all duration-300",
        ],
        hud: [
          "relative overflow-hidden rounded-full",
          "bg-gradient-to-br from-cyan-400/10 to-cyan-600/5",
          "border border-cyan-400/40 text-cyan-400",
          "hover:shadow-cyan-400/40 hover:shadow-lg",
          "font-mono uppercase tracking-wider text-xs",
        ],
        glass: [
          "relative overflow-hidden backdrop-blur-md",
          "bg-white/10 border border-white/20",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300",
        ],
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9",
        hexagon: "h-20 w-20",
        hud: "h-16 w-16 md:h-20 md:w-20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  animated?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, animated = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Use motion.button for holographic variants or when animated is true
    const shouldUseMotion = animated ||
      variant === "holographic" ||
      variant === "holographic-danger" ||
      variant === "hexagon" ||
      variant === "hud";

    if (shouldUseMotion) {
      const MotionComp = motion(Comp);

      const getMotionProps = () => {
        const baseProps = {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.2 }
        };

        switch (variant) {
          case "hexagon":
            return {
              ...baseProps,
              whileHover: {
                scale: 1.1,
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.4)"
              },
              whileTap: { scale: 0.95 },
              style: {
                clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
              }
            };
          case "hud":
            return {
              ...baseProps,
              whileHover: {
                scale: 1.1,
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.4)"
              }
            };
          default:
            return baseProps;
        }
      };

      return (
        <MotionComp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...getMotionProps()}
          {...props}
        >
          {children}
        </MotionComp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };