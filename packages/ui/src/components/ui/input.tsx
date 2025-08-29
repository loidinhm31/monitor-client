import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "bg-black/20 border-cyan-400/30 text-cyan-400",
          "placeholder:text-cyan-400/50",
          "focus:border-cyan-400/60 focus:shadow-cyan-400/20 focus:shadow-md",
          "font-mono",
        ],
        ghost: "border-transparent bg-transparent shadow-none",
        glass: [
          "bg-white/10 backdrop-blur-md border-white/20",
          "focus:border-white/40 focus:shadow-white/10 focus:shadow-md",
        ],
      },
      inputSize: {
        default: "h-9",
        sm: "h-8 text-xs",
        lg: "h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };