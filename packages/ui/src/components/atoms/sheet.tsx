import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const sheetOverlayVariants = cva(
  "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  {
    variants: {
      variant: {
        default: "bg-black/80 backdrop-blur-sm",
        holographic: "bg-black/90 backdrop-blur-md",
        "holographic-secondary": "bg-black/90 backdrop-blur-md",
        "holographic-destructive": "bg-black/90 backdrop-blur-md",
        glass: "bg-black/60 backdrop-blur-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const sheetContentVariants = cva(
  "fixed z-50 gap-4 p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      variant: {
        default: "bg-background border",
        holographic: [
          "bg-gradient-to-br from-cyan-400/10 to-cyan-600/10",
          "backdrop-blur-md border border-cyan-400/30",
          "shadow-cyan-400/20 shadow-2xl",
          "text-cyan-300",
        ],
        "holographic-secondary": [
          "bg-gradient-to-br from-slate-400/10 to-slate-600/10",
          "backdrop-blur-md border border-slate-400/30",
          "shadow-slate-400/20 shadow-2xl",
          "text-slate-300",
        ],
        "holographic-destructive": [
          "bg-gradient-to-br from-red-400/10 to-red-600/10",
          "backdrop-blur-md border border-red-400/30",
          "shadow-red-400/20 shadow-2xl",
          "text-red-300",
        ],
        glass: ["bg-white/10 backdrop-blur-lg border border-white/20", "shadow-2xl text-white"],
      },
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
      variant: "default",
    },
  },
);

interface SheetOverlayProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>,
    VariantProps<typeof sheetOverlayVariants> {}

const SheetOverlay = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Overlay>, SheetOverlayProps>(
  ({ className, variant, ...props }, ref) => (
    <SheetPrimitive.Overlay className={cn(sheetOverlayVariants({ variant }), className)} {...props} ref={ref} />
  ),
);

SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetContentVariants> {}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = "right", variant, className, children, ...props }, ref) => {
    const getCloseButtonClasses = () => {
      switch (variant) {
        case "holographic":
          return "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/20 border-cyan-400/30 hover:border-cyan-400/50";
        case "holographic-secondary":
          return "text-slate-400 hover:text-slate-300 hover:bg-slate-400/20 border-slate-400/30 hover:border-slate-400/50";
        case "holographic-destructive":
          return "text-red-400 hover:text-red-300 hover:bg-red-400/20 border-red-400/30 hover:border-red-400/50";
        case "glass":
          return "text-white hover:text-white/90 hover:bg-white/20 border-white/30 hover:border-white/50";
        default:
          return "text-muted-foreground hover:opacity-100";
      }
    };

    return (
      <SheetPortal>
        <SheetOverlay variant={variant} />
        <SheetPrimitive.Content ref={ref} className={cn(sheetContentVariants({ side, variant }), className)} {...props}>
          {/* Holographic grid effect for holographic variants */}
          {variant?.includes("holographic") && (
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `
                linear-gradient(${variant === "holographic" ? "rgba(0, 212, 255, 0.2)" : variant === "holographic-secondary" ? "rgba(148, 163, 184, 0.2)" : "rgba(248, 113, 113, 0.2)"} 1px, transparent 1px),
                linear-gradient(90deg, ${variant === "holographic" ? "rgba(0, 212, 255, 0.2)" : variant === "holographic-secondary" ? "rgba(148, 163, 184, 0.2)" : "rgba(248, 113, 113, 0.2)"} 1px, transparent 1px)
              `,
                backgroundSize: "20px 20px",
              }}
            />
          )}

          {children}

          <SheetPrimitive.Close
            className={cn(
              "absolute right-4 top-4 rounded-sm border opacity-70 ring-offset-background transition-opacity",
              "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none data-[state=open]:bg-secondary",
              "h-6 w-6 p-0 flex items-center justify-center",
              variant?.includes("holographic") && "font-mono",
              getCloseButtonClasses(),
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);

SheetContent.displayName = SheetPrimitive.Content.displayName;

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof sheetContentVariants>["variant"];
}

const SheetHeader = ({ className, variant, ...props }: SheetHeaderProps) => {
  const getBorderClasses = () => {
    switch (variant) {
      case "holographic":
        return "border-cyan-400/20";
      case "holographic-secondary":
        return "border-slate-400/20";
      case "holographic-destructive":
        return "border-red-400/20";
      case "glass":
        return "border-white/20";
      default:
        return "border-border";
    }
  };

  return (
    <div
      className={cn("flex flex-col space-y-2 text-center sm:text-left pb-4 border-b", getBorderClasses(), className)}
      {...props}
    />
  );
};

SheetHeader.displayName = "SheetHeader";

interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof sheetContentVariants>["variant"];
}

const SheetFooter = ({ className, variant, ...props }: SheetFooterProps) => {
  const getBorderClasses = () => {
    switch (variant) {
      case "holographic":
        return "border-cyan-400/20";
      case "holographic-secondary":
        return "border-slate-400/20";
      case "holographic-destructive":
        return "border-red-400/20";
      case "glass":
        return "border-white/20";
      default:
        return "border-border";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t",
        getBorderClasses(),
        className,
      )}
      {...props}
    />
  );
};

SheetFooter.displayName = "SheetFooter";

interface SheetTitleProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> {
  variant?: VariantProps<typeof sheetContentVariants>["variant"];
}

const SheetTitle = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Title>, SheetTitleProps>(
  ({ className, variant, ...props }, ref) => {
    const getTitleClasses = () => {
      const baseClasses = "text-lg font-semibold";

      switch (variant) {
        case "holographic":
          return cn(
            baseClasses,
            "text-cyan-400 font-mono uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text",
          );
        case "holographic-secondary":
          return cn(
            baseClasses,
            "text-slate-400 font-mono uppercase tracking-wider bg-gradient-to-r from-slate-400 to-slate-300 bg-clip-text",
          );
        case "holographic-destructive":
          return cn(
            baseClasses,
            "text-red-400 font-mono uppercase tracking-wider bg-gradient-to-r from-red-400 to-red-300 bg-clip-text",
          );
        case "glass":
          return cn(baseClasses, "text-white bg-gradient-to-r from-white to-white/80 bg-clip-text");
        default:
          return cn(baseClasses, "text-foreground");
      }
    };

    return <SheetPrimitive.Title ref={ref} className={cn(getTitleClasses(), className)} {...props} />;
  },
);

SheetTitle.displayName = SheetPrimitive.Title.displayName;

interface SheetDescriptionProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> {
  variant?: VariantProps<typeof sheetContentVariants>["variant"];
}

const SheetDescription = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Description>, SheetDescriptionProps>(
  ({ className, variant, ...props }, ref) => {
    const getDescriptionClasses = () => {
      switch (variant) {
        case "holographic":
          return "text-cyan-400/80 font-mono text-sm";
        case "holographic-secondary":
          return "text-slate-400/80 font-mono text-sm";
        case "holographic-destructive":
          return "text-red-400/80 font-mono text-sm";
        case "glass":
          return "text-white/80 text-sm";
        default:
          return "text-muted-foreground text-sm";
      }
    };

    return <SheetPrimitive.Description ref={ref} className={cn(getDescriptionClasses(), className)} {...props} />;
  },
);

SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetContentVariants,
  sheetOverlayVariants,
};
