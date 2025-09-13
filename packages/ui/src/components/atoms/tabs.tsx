import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const tabsListVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "bg-gradient-to-r from-cyan-400/10 to-cyan-600/10",
          "backdrop-blur-md border border-cyan-400/30",
          "shadow-cyan-400/20 shadow-md",
        ],
        "holographic-secondary": [
          "bg-gradient-to-r from-slate-400/10 to-slate-600/10",
          "backdrop-blur-md border border-slate-400/30",
          "shadow-slate-400/20 shadow-md",
        ],
        "holographic-destructive": [
          "bg-gradient-to-r from-red-400/10 to-red-600/10",
          "backdrop-blur-md border border-red-400/30",
          "shadow-red-400/20 shadow-md",
        ],
        glass: "bg-white/10 backdrop-blur-md border border-white/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "text-cyan-400/70 font-mono uppercase tracking-wider text-xs",
          "data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400",
          "data-[state=active]:shadow-cyan-400/30 data-[state=active]:shadow-md",
          "hover:text-cyan-400/90",
        ],
        "holographic-secondary": [
          "text-slate-400/70 font-mono uppercase tracking-wider text-xs",
          "data-[state=active]:bg-slate-400/20 data-[state=active]:text-slate-400",
          "data-[state=active]:shadow-slate-400/30 data-[state=active]:shadow-md",
          "hover:text-slate-400/90",
        ],
        "holographic-destructive": [
          "text-red-400/70 font-mono uppercase tracking-wider text-xs",
          "data-[state=active]:bg-red-400/20 data-[state=active]:text-red-400",
          "data-[state=active]:shadow-red-400/30 data-[state=active]:shadow-md",
          "hover:text-red-400/90",
        ],
        glass: ["data-[state=active]:bg-white/20 data-[state=active]:text-white", "hover:text-white/90"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Tabs = TabsPrimitive.Root;

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn(tabsListVariants({ variant }), className)} {...props} />
  ),
);

TabsList.displayName = TabsPrimitive.List.displayName;

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  ({ className, variant, ...props }, ref) => (
    <TabsPrimitive.Trigger ref={ref} className={cn(tabsTriggerVariants({ variant }), className)} {...props} />
  ),
);

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));

TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
