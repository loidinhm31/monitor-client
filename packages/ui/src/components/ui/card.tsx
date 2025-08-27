import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const cardVariants = cva(
  "rounded-3xl text-card-foreground shadow-liquid-md transition-all duration-500 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-card border border-border",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 shadow-glass",
        cloud: "cloud-card hover:shadow-liquid-lg",
        liquid: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 liquid-border",
        floating: "cloud-card float-element hover:shadow-liquid-xl",
        glow: "bg-card border border-border shadow-liquid-lg hover:shadow-cloud-glow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, children, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
    {variant === "liquid" && (
      <div className="absolute inset-0 bg-gradient-to-br from-liquid-500/10 to-dream-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    )}
    {variant === "floating" && <div className="liquid-blob absolute -top-20 -right-20 w-40 h-40 rounded-full" />}
    <div className="relative z-10">{children}</div>
  </div>
));

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent",
        className,
      )}
      {...props}
    />
  ),
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
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
