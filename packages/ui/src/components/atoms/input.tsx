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
        "holographic-secondary": [
          "bg-black/20 border-slate-400/30 text-slate-400",
          "placeholder:text-slate-400/50",
          "focus:border-slate-400/60 focus:shadow-slate-400/20 focus:shadow-md",
          "font-mono",
        ],
        "holographic-destructive": [
          "bg-black/20 border-red-400/30 text-red-400",
          "placeholder:text-red-400/50",
          "focus:border-red-400/60 focus:shadow-red-400/20 focus:shadow-md",
          "font-mono",
        ],
        ghost: "border-transparent bg-transparent shadow-none",
        glass: [
          "bg-white/10 backdrop-blur-md border-white/20 text-white",
          "placeholder:text-white/50",
          "focus:border-white/40 focus:shadow-white/10 focus:shadow-md",
        ],
        "glass-secondary": [
          "bg-slate-400/10 backdrop-blur-md border-slate-400/20",
          "focus:border-slate-400/40 focus:shadow-slate-400/10 focus:shadow-md",
          "text-slate-400 placeholder:text-slate-400/50",
        ],
        "glass-destructive": [
          "bg-red-400/10 backdrop-blur-md border-red-400/20",
          "focus:border-red-400/40 focus:shadow-red-400/10 focus:shadow-md",
          "text-red-400 placeholder:text-red-400/50",
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
  },
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return <input ref={ref} className={cn(inputVariants({ variant, inputSize }), className)} type={type} {...props} />;
  },
);

Input.displayName = "Input";

export { Input, inputVariants };
