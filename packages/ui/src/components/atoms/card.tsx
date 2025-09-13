import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";

const cardVariants = cva(
  "rounded-3xl text-card-foreground shadow-lg transition-all duration-500 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-card border border-border",
        secondary: "bg-secondary text-secondary-foreground border border-border",
        destructive: "bg-destructive/10 text-destructive border border-destructive/30",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 shadow-glass",
        holographic: [
          "bg-gradient-to-br from-cyan-400/5 to-cyan-600/5",
          "backdrop-blur-md border border-cyan-400/30",
          "shadow-cyan-400/20 shadow-lg",
          "hover:shadow-cyan-400/30 hover:shadow-xl",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:z-0",
          "before:from-transparent before:via-cyan-400/10 before:to-transparent",
          "before:translate-x-[-100%] hover:before:translate-x-[100%]",
          "before:transition-transform before:duration-1000",
        ],
        "holographic-secondary": [
          "bg-gradient-to-br from-slate-400/5 to-slate-600/5",
          "backdrop-blur-md border border-slate-400/30",
          "shadow-slate-400/20 shadow-lg text-slate-400",
          "hover:shadow-slate-400/30 hover:shadow-xl",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:z-0",
          "before:from-transparent before:via-slate-400/10 before:to-transparent",
          "before:translate-x-[-100%] hover:before:translate-x-[100%]",
          "before:transition-transform before:duration-1000",
        ],
        "holographic-destructive": [
          "bg-gradient-to-br from-red-400/5 to-red-600/5",
          "backdrop-blur-md border border-red-400/30",
          "shadow-red-400/20 shadow-lg text-red-400",
          "hover:shadow-red-400/30 hover:shadow-xl",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:z-0",
          "before:from-transparent before:via-red-400/10 before:to-transparent",
          "before:translate-x-[-100%] hover:before:translate-x-[100%]",
          "before:transition-transform before:duration-1000",
        ],
        liquid: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20",
        floating: [
          "bg-card/80 backdrop-blur-sm border border-border/50",
          "hover:shadow-2xl hover:shadow-primary/20",
          "transform-gpu transition-all duration-500",
        ],
        glow: [
          "bg-card border border-border",
          "shadow-lg hover:shadow-2xl hover:shadow-primary/20",
          "transition-all duration-300",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  animated?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, animated = false, children, ...props }, ref) => {
    // Extract problematic props that conflict with motion
    const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...safeProps } = props;

    if (animated) {
      return (
        <motion.div
          ref={ref}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          className={cn(cardVariants({ variant }), className)}
          initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
          transition={{ duration: 0.5 }}
          whileHover={variant === "floating" ? { scale: 1.02, y: -4 } : undefined}
          {...safeProps}
        >
          <div className="relative z-10">{children}</div>
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
        <div className="relative z-10">{children}</div>
      </div>
    );
  },
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
      {children}
    </h3>
  ),
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
