import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const selectTriggerVariants = cva(
  "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "bg-black/20 border-cyan-400/30 text-cyan-400",
          "focus:border-cyan-400/60 focus:shadow-cyan-400/20 focus:shadow-md",
          "font-mono [&_svg]:text-cyan-400/70",
          "hover:border-cyan-400/50 hover:shadow-cyan-400/10 hover:shadow-sm",
          // Animated border effect
          "relative before:absolute before:inset-0 before:rounded-md",
          "before:bg-gradient-to-r before:from-cyan-400/0 before:via-cyan-400/20 before:to-cyan-400/0",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "focus:before:opacity-100",
        ],
        "holographic-secondary": [
          "bg-black/20 border-slate-400/30 text-slate-400",
          "focus:border-slate-400/60 focus:shadow-slate-400/20 focus:shadow-md",
          "font-mono [&_svg]:text-slate-400/70",
          "hover:border-slate-400/50 hover:shadow-slate-400/10 hover:shadow-sm",
          "relative before:absolute before:inset-0 before:rounded-md",
          "before:bg-gradient-to-r before:from-slate-400/0 before:via-slate-400/20 before:to-slate-400/0",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "focus:before:opacity-100",
        ],
        "holographic-destructive": [
          "bg-black/20 border-red-400/30 text-red-400",
          "focus:border-red-400/60 focus:shadow-red-400/20 focus:shadow-md",
          "font-mono [&_svg]:text-red-400/70",
          "hover:border-red-400/50 hover:shadow-red-400/10 hover:shadow-sm",
          "relative before:absolute before:inset-0 before:rounded-md",
          "before:bg-gradient-to-r before:from-red-400/0 before:via-red-400/20 before:to-red-400/0",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "focus:before:opacity-100",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md border-white/20 text-white",
          "focus:border-white/40 focus:shadow-white/10 focus:shadow-md",
          "[&_svg]:text-white/70",
          "hover:border-white/30 hover:shadow-white/5 hover:shadow-sm",
        ],
        "glass-secondary": [
          "bg-slate-400/10 backdrop-blur-md border-slate-400/20",
          "focus:border-slate-400/40 focus:shadow-slate-400/10 focus:shadow-md",
          "text-slate-400 [&_svg]:text-slate-400/70",
          "hover:border-slate-400/30 hover:shadow-slate-400/5 hover:shadow-sm",
        ],
        "glass-destructive": [
          "bg-red-400/10 backdrop-blur-md border-red-400/20",
          "focus:border-red-400/40 focus:shadow-red-400/10 focus:shadow-md",
          "text-red-400 [&_svg]:text-red-400/70",
          "hover:border-red-400/30 hover:shadow-red-400/5 hover:shadow-sm",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const selectContentVariants = cva(
  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "bg-black/95 border-cyan-400/30 backdrop-blur-md",
          "shadow-cyan-400/20 shadow-xl text-cyan-400",
          // Grid pattern overlay
          "before:absolute before:inset-0 before:opacity-5 before:pointer-events-none",
          "before:bg-[linear-gradient(rgba(0,212,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.3)_1px,transparent_1px)]",
          "before:bg-[size:20px_20px]",
        ],
        "holographic-secondary": [
          "bg-black/95 border-slate-400/30 backdrop-blur-md",
          "shadow-slate-400/20 shadow-xl text-slate-400",
          "before:absolute before:inset-0 before:opacity-5 before:pointer-events-none",
          "before:bg-[linear-gradient(rgba(148,163,184,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.3)_1px,transparent_1px)]",
          "before:bg-[size:20px_20px]",
        ],
        "holographic-destructive": [
          "bg-black/95 border-red-400/30 backdrop-blur-md",
          "shadow-red-400/20 shadow-xl text-red-400",
          "before:absolute before:inset-0 before:opacity-5 before:pointer-events-none",
          "before:bg-[linear-gradient(rgba(248,113,113,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(248,113,113,0.3)_1px,transparent_1px)]",
          "before:bg-[size:20px_20px]",
        ],
        glass: ["bg-white/10 backdrop-blur-lg border-white/20", "shadow-xl text-white"],
        "glass-secondary": ["bg-slate-400/10 backdrop-blur-lg border-slate-400/20", "shadow-xl text-slate-400"],
        "glass-destructive": ["bg-red-400/10 backdrop-blur-lg border-red-400/20", "shadow-xl text-red-400"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const selectItemVariants = cva(
  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "text-cyan-300 font-mono",
          "hover:bg-cyan-400/20 hover:text-cyan-300",
          "focus:bg-cyan-400/30 focus:text-cyan-200",
          "data-[state=checked]:bg-cyan-400/40 data-[state=checked]:text-cyan-200",
          "data-[state=checked]:font-semibold",
        ],
        "holographic-secondary": [
          "text-slate-300 font-mono",
          "hover:bg-slate-400/20 hover:text-slate-300",
          "focus:bg-slate-400/30 focus:text-slate-200",
          "data-[state=checked]:bg-slate-400/40 data-[state=checked]:text-slate-200",
          "data-[state=checked]:font-semibold",
        ],
        "holographic-destructive": [
          "text-red-300 font-mono",
          "hover:bg-red-400/20 hover:text-red-300",
          "focus:bg-red-400/30 focus:text-red-200",
          "data-[state=checked]:bg-red-400/40 data-[state=checked]:text-red-200",
          "data-[state=checked]:font-semibold",
        ],
        glass: [
          "text-white/90",
          "hover:bg-white/20 hover:text-white",
          "focus:bg-white/30 focus:text-white",
          "data-[state=checked]:bg-white/40 data-[state=checked]:text-white",
        ],
        "glass-secondary": [
          "text-slate-300",
          "hover:bg-slate-400/20 hover:text-slate-200",
          "focus:bg-slate-400/30 focus:text-slate-100",
          "data-[state=checked]:bg-slate-400/40 data-[state=checked]:text-slate-100",
        ],
        "glass-destructive": [
          "text-red-300",
          "hover:bg-red-400/20 hover:text-red-200",
          "focus:bg-red-400/30 focus:text-red-100",
          "data-[state=checked]:bg-red-400/40 data-[state=checked]:text-red-100",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
  ({ className, children, variant, ...props }, ref) => (
    <SelectPrimitive.Trigger ref={ref} className={cn(selectTriggerVariants({ variant }), className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
);

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & {
    variant?: VariantProps<typeof selectContentVariants>["variant"];
  }
>(({ className, variant, ...props }, ref) => {
  const getButtonClasses = () => {
    switch (variant) {
      case "holographic":
        return "text-cyan-400 hover:text-cyan-300";
      case "holographic-secondary":
        return "text-slate-400 hover:text-slate-300";
      case "holographic-destructive":
        return "text-red-400 hover:text-red-300";
      case "glass":
      case "glass-secondary":
      case "glass-destructive":
        return "text-white hover:text-white/90";
      default:
        return "";
    }
  };

  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", getButtonClasses(), className)}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  );
});

SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> & {
    variant?: VariantProps<typeof selectContentVariants>["variant"];
  }
>(({ className, variant, ...props }, ref) => {
  const getButtonClasses = () => {
    switch (variant) {
      case "holographic":
        return "text-cyan-400 hover:text-cyan-300";
      case "holographic-secondary":
        return "text-slate-400 hover:text-slate-300";
      case "holographic-destructive":
        return "text-red-400 hover:text-red-300";
      case "glass":
      case "glass-secondary":
      case "glass-destructive":
        return "text-white hover:text-white/90";
      default:
        return "";
    }
  };

  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", getButtonClasses(), className)}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  );
});

SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
    VariantProps<typeof selectContentVariants> {}

const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, SelectContentProps>(
  ({ className, children, position = "popper", variant, ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          selectContentVariants({ variant }),
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton variant={variant} />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton variant={variant} />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
);

SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & {
    variant?: VariantProps<typeof selectContentVariants>["variant"];
  }
>(({ className, variant, ...props }, ref) => {
  const getLabelClasses = () => {
    switch (variant) {
      case "holographic":
        return "text-cyan-400 font-mono uppercase tracking-wider";
      case "holographic-secondary":
        return "text-slate-400 font-mono uppercase tracking-wider";
      case "holographic-destructive":
        return "text-red-400 font-mono uppercase tracking-wider";
      case "glass":
      case "glass-secondary":
      case "glass-destructive":
        return "text-white font-semibold";
      default:
        return "";
    }
  };

  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", getLabelClasses(), className)}
      {...props}
    />
  );
});

SelectLabel.displayName = SelectPrimitive.Label.displayName;

interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
    VariantProps<typeof selectItemVariants> {}

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ className, children, variant, ...props }, ref) => {
    const getCheckIconClasses = () => {
      switch (variant) {
        case "holographic":
          return "text-cyan-300";
        case "holographic-secondary":
          return "text-slate-300";
        case "holographic-destructive":
          return "text-red-300";
        case "glass":
        case "glass-secondary":
        case "glass-destructive":
          return "text-white";
        default:
          return "";
      }
    };

    return (
      <SelectPrimitive.Item ref={ref} className={cn(selectItemVariants({ variant }), className)} {...props}>
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className={cn("h-4 w-4", getCheckIconClasses())} />
          </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </SelectPrimitive.Item>
    );
  },
);

SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & {
    variant?: VariantProps<typeof selectContentVariants>["variant"];
  }
>(({ className, variant, ...props }, ref) => {
  const getSeparatorClasses = () => {
    switch (variant) {
      case "holographic":
        return "bg-cyan-400/20";
      case "holographic-secondary":
        return "bg-slate-400/20";
      case "holographic-destructive":
        return "bg-red-400/20";
      case "glass":
      case "glass-secondary":
      case "glass-destructive":
        return "bg-white/20";
      default:
        return "bg-muted";
    }
  };

  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px", getSeparatorClasses(), className)}
      {...props}
    />
  );
});

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  selectTriggerVariants,
  selectContentVariants,
  selectItemVariants,
};
