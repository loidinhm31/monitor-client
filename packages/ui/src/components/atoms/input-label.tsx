import * as React from "react";
import { Input, InputProps } from "@repo/ui/components/atoms/input";
import { Label } from "@repo/ui/components/atoms/label";
import { cn } from "@repo/ui/lib/utils";
import { useId } from "react";

interface InputWithLabelProps extends InputProps {
  label?: string;
  labelClassName?: string;
  required?: boolean;
  error?: string;
  description?: string;
  containerClassName?: string;
}

const InputLabel = React.forwardRef<HTMLInputElement, InputWithLabelProps>(
  (
    { label, labelClassName, required, error, description, containerClassName, className, id, variant, ...props },
    ref,
  ) => {
    const inputId = id || useId();

    const getLabelColor = () => {
      switch (variant) {
        case "holographic":
          return "text-cyan-400";
        case "holographic-secondary":
          return "text-slate-400";
        case "holographic-destructive":
          return "text-red-400";
        case "glass":
          return "text-white";
        case "glass-secondary":
          return "text-slate-400";
        case "glass-destructive":
          return "text-red-400";
        default:
          return "text-foreground";
      }
    };

    const getDescriptionColor = () => {
      switch (variant) {
        case "holographic":
          return "text-cyan-400/70";
        case "holographic-secondary":
          return "text-slate-400/70";
        case "holographic-destructive":
          return "text-red-400/70";
        case "glass":
          return "text-white/70";
        case "glass-secondary":
          return "text-slate-400/70";
        case "glass-destructive":
          return "text-red-400/70";
        default:
          return "text-muted-foreground";
      }
    };

    const isHolographic = variant?.includes("holographic");

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              getLabelColor(),
              isHolographic && "font-mono",
              required && "after:content-['*'] after:text-red-400 after:ml-1",
              labelClassName,
            )}
            htmlFor={inputId}
          >
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          aria-describedby={description ? `${inputId}-description` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(error && "border-red-400/50 focus:border-red-400", className)}
          id={inputId}
          variant={variant}
          {...props}
        />
        {description && (
          <p
            className={cn("text-xs", getDescriptionColor(), isHolographic && "font-mono")}
            id={`${inputId}-description`}
          >
            {description}
          </p>
        )}
        {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
      </div>
    );
  },
);

InputLabel.displayName = "InputWithLabel";

export { InputLabel, type InputWithLabelProps };
