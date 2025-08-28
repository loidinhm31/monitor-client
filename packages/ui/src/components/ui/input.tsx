import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-xl border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-input hover:border-ring/50",
        liquid: "liquid-input border-0 shadow-liquid-sm focus:shadow-liquid-md",
        glass: "bg-white/10 backdrop-blur-md border-white/20 shadow-glass hover:bg-white/15 focus:bg-white/20",
        cloud: "bg-cloud-50/50 border-cloud-200 hover:border-cloud-300 focus:border-liquid-500 focus:bg-cloud-50",
        outline: "border-2 border-dashed border-muted hover:border-ring/50 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  isRequired?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, icon, rightIcon, label, isRequired, ...props }, ref) => {
    const inputElement = icon || rightIcon ? (
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <input
          ref={ref}
          className={cn(inputVariants({ variant }), icon && "pl-10", rightIcon && "pr-10", className)}
          type={type}
          required={isRequired}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightIcon}</div>
        )}
      </div>
    ) : (
      <input 
        ref={ref} 
        className={cn(inputVariants({ variant }), className)} 
        type={type} 
        required={isRequired}
        {...props} 
      />
    );

    if (label) {
      return (
        <div className="w-full">
          <label className="block text-sm font-medium text-foreground mb-1">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {inputElement}
        </div>
      );
    }

    return inputElement;
  },
);

Input.displayName = "Input";

export { Input, inputVariants };
