import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/atoms/button";

const calendarVariants = cva("p-3 relative", {
  variants: {
    variant: {
      default: "",
      holographic: [
        "bg-gradient-to-br from-cyan-400/5 to-cyan-600/5",
        "backdrop-blur-sm border border-cyan-400/30 rounded-lg",
        "shadow-cyan-400/20 shadow-lg text-cyan-400",
      ],
      "holographic-secondary": [
        "bg-gradient-to-br from-slate-400/5 to-slate-600/5",
        "backdrop-blur-sm border border-slate-400/30 rounded-lg",
        "shadow-slate-400/20 shadow-lg text-slate-400",
      ],
      "holographic-destructive": [
        "bg-gradient-to-br from-red-400/5 to-red-600/5",
        "backdrop-blur-sm border border-red-400/30 rounded-lg",
        "shadow-red-400/20 shadow-lg text-red-400",
      ],
      glass: ["bg-white/10 backdrop-blur-md border border-white/20 rounded-lg", "shadow-lg text-white"],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  variant,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: "default" | "outline" | "ghost" | "holographic" | "holographic-secondary" | "holographic-destructive";
  variant?: VariantProps<typeof calendarVariants>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  // Determine navigation button variant based on calendar variant
  const getNavButtonVariant = () => {
    if (variant?.includes("holographic")) {
      return variant as "holographic" | "holographic-secondary" | "holographic-destructive";
    }
    return buttonVariant;
  };

  // Get appropriate text colors for different variants
  const getVariantTextClasses = () => {
    switch (variant) {
      case "holographic":
        return "text-cyan-400 [&_.rdp-head_cell]:text-cyan-400/70 [&_.rdp-caption]:text-cyan-400";
      case "holographic-secondary":
        return "text-slate-400 [&_.rdp-head_cell]:text-slate-400/70 [&_.rdp-caption]:text-slate-400";
      case "holographic-destructive":
        return "text-red-400 [&_.rdp-head_cell]:text-red-400/70 [&_.rdp-caption]:text-red-400";
      case "glass":
        return "text-white [&_.rdp-head_cell]:text-white/70 [&_.rdp-caption]:text-white";
      default:
        return "";
    }
  };

  return (
    <DayPicker
      captionLayout={captionLayout}
      showOutsideDays={showOutsideDays}
      className={cn(calendarVariants({ variant }), getVariantTextClasses(), className)}
      classNames={{
        months: cn(defaultClassNames.months, "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0"),
        month: cn(defaultClassNames.month, "space-y-4"),
        caption: cn(
          defaultClassNames.caption,
          "flex justify-center pt-1 relative items-center font-mono uppercase tracking-wider",
        ),
        caption_label: cn(defaultClassNames.caption_label, "text-sm font-medium font-mono"),
        nav: cn(defaultClassNames.nav, "space-x-1 flex items-center"),
        nav_button_previous: cn(defaultClassNames.nav_button_previous, "absolute left-1"),
        nav_button_next: cn(defaultClassNames.nav_button_next, "absolute right-1"),
        table: cn(defaultClassNames.table, "w-full border-collapse space-y-1"),
        head_row: cn(defaultClassNames.head_row, "flex"),
        head_cell: cn(
          defaultClassNames.head_cell,
          "rounded-md w-8 font-normal text-xs font-mono uppercase tracking-wider opacity-70",
        ),
        row: cn(defaultClassNames.row, "flex w-full mt-2"),
        cell: cn(
          defaultClassNames.cell,
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
        ),
        day: cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-selected:opacity-100 h-8 w-8 p-0 font-mono",
          // Holographic day styling
          variant?.includes("holographic") && [
            "hover:bg-transparent hover:border hover:shadow-md",
            variant === "holographic" && "hover:border-cyan-400/50 hover:shadow-cyan-400/20 hover:text-cyan-300",
            variant === "holographic-secondary" &&
              "hover:border-slate-400/50 hover:shadow-slate-400/20 hover:text-slate-300",
            variant === "holographic-destructive" &&
              "hover:border-red-400/50 hover:shadow-red-400/20 hover:text-red-300",
            // Selected states
            "aria-selected:bg-transparent aria-selected:border",
            variant === "holographic" &&
              "aria-selected:border-cyan-400 aria-selected:bg-cyan-400/20 aria-selected:text-cyan-300",
            variant === "holographic-secondary" &&
              "aria-selected:border-slate-400 aria-selected:bg-slate-400/20 aria-selected:text-slate-300",
            variant === "holographic-destructive" &&
              "aria-selected:border-red-400 aria-selected:bg-red-400/20 aria-selected:text-red-300",
          ],
          variant === "glass" && [
            "hover:bg-white/20 hover:text-white",
            "aria-selected:bg-white/30 aria-selected:text-white",
          ],
        ),
        day_range_end: cn(defaultClassNames.day_range_end, "day-range-end"),
        day_selected: cn(
          defaultClassNames.day_selected,
          "text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        ),
        day_today: cn(
          defaultClassNames.day_today,
          variant?.includes("holographic")
            ? variant === "holographic"
              ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/50"
              : variant === "holographic-secondary"
                ? "bg-slate-400/20 text-slate-300 border border-slate-400/50"
                : "bg-red-400/20 text-red-300 border border-red-400/50"
            : "bg-accent text-accent-foreground",
        ),
        day_outside: cn(
          defaultClassNames.day_outside,
          "day-outside opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        ),
        day_disabled: cn(defaultClassNames.day_disabled, "opacity-30"),
        day_range_middle: cn(
          defaultClassNames.day_range_middle,
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        ),
        day_hidden: cn(defaultClassNames.day_hidden, "invisible"),
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeftIcon className="h-4 w-4" />,
        IconRight: () => <ChevronRightIcon className="h-4 w-4" />,
        IconDropdown: () => <ChevronDownIcon className="h-4 w-4" />,
        Caption: ({ ...captionProps }) => {
          const { goToMonth, nextMonth, previousMonth } = captionProps;
          return (
            <div className="flex justify-center pt-1 relative items-center">
              {previousMonth && (
                <Button
                  variant={getNavButtonVariant()}
                  size="icon"
                  className="absolute left-1 h-7 w-7"
                  onClick={() => goToMonth(previousMonth)}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="sr-only">Previous month</span>
                </Button>
              )}
              <div className="text-sm font-medium font-mono uppercase tracking-wider">
                {formatters?.formatCaption
                  ? formatters.formatCaption(captionProps.displayMonth, { locale: captionProps.locale })
                  : captionProps.displayMonth.toLocaleDateString(captionProps.locale, {
                      month: "long",
                      year: "numeric",
                    })}
              </div>
              {nextMonth && (
                <Button
                  variant={getNavButtonVariant()}
                  size="icon"
                  className="absolute right-1 h-7 w-7"
                  onClick={() => goToMonth(nextMonth)}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="sr-only">Next month</span>
                </Button>
              )}
            </div>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, ...props }: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  return (
    <DayButton
      className={cn(
        "data-[disabled=true]:text-muted-foreground data-[disabled=true]:opacity-50 data-[outside-month=true]:pointer-events-none data-[outside-month=true]:text-muted-foreground data-[outside-month=true]:opacity-50 data-[today=true]:bg-accent data-[today=true]:text-accent-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton, calendarVariants };