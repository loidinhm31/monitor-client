import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
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
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
        // Enhanced holographic variants
        holographic: [
          "relative overflow-hidden font-mono uppercase tracking-wider",
          "bg-gradient-to-br from-cyan-400/10 to-cyan-600/10",
          "border border-cyan-400/50 text-cyan-400",
          "hover:shadow-cyan-400/40 hover:shadow-lg",
          "transition-all duration-300",
          "before:absolute before:inset-0 before:bg-gradient-to-r",
          "before:from-transparent before:via-cyan-400/10 before:to-transparent",
          "before:-translate-x-full before:transition-transform before:duration-1000",
          "hover:before:translate-x-full",
        ],
        "holographic-secondary": [
          "relative overflow-hidden font-mono uppercase tracking-wider",
          "bg-gradient-to-br from-slate-400/10 to-slate-600/10",
          "border border-slate-400/50 text-slate-400",
          "hover:shadow-slate-400/40 hover:shadow-lg",
          "transition-all duration-300",
          "before:absolute before:inset-0 before:bg-gradient-to-r",
          "before:from-transparent before:via-slate-400/10 before:to-transparent",
          "before:-translate-x-full before:transition-transform before:duration-1000",
          "hover:before:translate-x-full",
        ],
        "holographic-destructive": [
          "relative overflow-hidden font-mono uppercase tracking-wider",
          "bg-gradient-to-br from-red-400/10 to-red-600/10",
          "border border-red-400/50 text-red-400",
          "hover:shadow-red-400/40 hover:shadow-lg",
          "transition-all duration-300",
          "before:absolute before:inset-0 before:bg-gradient-to-r",
          "before:from-transparent before:via-red-400/10 before:to-transparent",
          "before:-translate-x-full before:transition-transform before:duration-1000",
          "hover:before:translate-x-full",
        ],
        // Existing HUD/Hexagon variants
        hexagon: [
          "relative bg-black/20 border border-cyan-400/50 text-cyan-400",
          "font-mono uppercase tracking-wider",
          "hover:shadow-cyan-400/40 hover:shadow-lg",
        ],
        "hexagon-secondary": [
          "relative bg-black/20 border border-slate-400/50 text-slate-400",
          "font-mono uppercase tracking-wider",
          "hover:shadow-slate-400/40 hover:shadow-lg",
        ],
        "hexagon-destructive": [
          "relative bg-black/20 border border-red-400/50 text-red-400",
          "font-mono uppercase tracking-wider",
          "hover:shadow-red-400/40 hover:shadow-lg",
        ],
        hud: [
          "relative bg-black/30 border border-cyan-400/30 text-cyan-400",
          "font-mono uppercase tracking-wider rounded-full",
          "hover:shadow-cyan-400/40 hover:shadow-lg",
        ],
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        hud: "h-16 w-16 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  animated?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, animated = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Use motion.button for holographic variants or when animated is true
    const shouldUseMotion =
      animated ||
      variant === "holographic" ||
      variant === "holographic-secondary" ||
      variant === "holographic-destructive" ||
      variant === "hexagon" ||
      variant === "hexagon-secondary" ||
      variant === "hexagon-destructive" ||
      variant === "hud";

    if (shouldUseMotion) {
      // Type assertion to handle the motion component properly
      const MotionComp = motion(Comp as any);

      const getMotionProps = (): HTMLMotionProps<"button"> => {
        const baseProps: HTMLMotionProps<"button"> = {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.2 },
        };

        switch (variant) {
          case "hexagon":
          case "hexagon-secondary":
          case "hexagon-destructive":
            return {
              ...baseProps,
              whileHover: {
                scale: 1.05,
                boxShadow: variant === "hexagon-destructive"
                  ? "0 0 20px rgba(248, 113, 113, 0.4)"
                  : variant === "hexagon-secondary"
                    ? "0 0 20px rgba(148, 163, 184, 0.4)"
                    : "0 0 20px rgba(0, 212, 255, 0.4)",
              },
              whileTap: { scale: 0.95 },
              style: {
                clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
              },
            };
          case "hud":
            return {
              ...baseProps,
              whileHover: {
                scale: 1.1,
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.4)",
              },
            };
          case "holographic":
          case "holographic-secondary":
          case "holographic-destructive":
            return {
              ...baseProps,
              whileHover: {
                scale: 1.02,
                boxShadow: variant === "holographic-destructive"
                  ? "0 0 25px rgba(248, 113, 113, 0.5)"
                  : variant === "holographic-secondary"
                    ? "0 0 25px rgba(148, 163, 184, 0.5)"
                    : "0 0 25px rgba(0, 212, 255, 0.5)",
              },
            };
          default:
            return baseProps;
        }
      };

      return (
        <MotionComp
          className={cn(buttonVariants({ variant, size }), className)}
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
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };