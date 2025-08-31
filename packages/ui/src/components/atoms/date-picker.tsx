"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "@repo/ui/components/atoms/label";
import { Input } from "@repo/ui/components/atoms/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/atoms/popover";
import { Button } from "@repo/ui/components/atoms/button";
import { Calendar } from "@repo/ui/components/atoms/calendar";
import { cn } from "@repo/ui/lib/utils";
import { CalendarDate } from "@internationalized/date";

const datePickerVariants = cva("relative flex gap-2", {
  variants: {
    variant: {
      default: "",
      holographic: "font-mono",
      "holographic-secondary": "font-mono",
      "holographic-destructive": "font-mono",
      glass: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const inputVariants = cva(
  "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-ring",
        holographic: [
          "bg-black/20 border-cyan-400/30 text-cyan-400 pr-10",
          "focus:border-cyan-400/60 focus:shadow-cyan-400/20 focus:shadow-md",
          "font-mono placeholder:text-cyan-400/50",
          "hover:border-cyan-400/50 hover:shadow-cyan-400/10 hover:shadow-sm",
          "relative before:absolute before:inset-0 before:rounded-md",
          "before:bg-gradient-to-r before:from-cyan-400/0 before:via-cyan-400/20 before:to-cyan-400/0",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "focus:before:opacity-100",
        ],
        "holographic-secondary": [
          "bg-black/20 border-slate-400/30 text-slate-400 pr-10",
          "focus:border-slate-400/60 focus:shadow-slate-400/20 focus:shadow-md",
          "font-mono placeholder:text-slate-400/50",
          "hover:border-slate-400/50 hover:shadow-slate-400/10 hover:shadow-sm",
          "relative before:absolute before:inset-0 before:rounded-md",
          "before:bg-gradient-to-r before:from-slate-400/0 before:via-slate-400/20 before:to-slate-400/0",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "focus:before:opacity-100",
        ],
        "holographic-destructive": [
          "bg-black/20 border-red-400/30 text-red-400 pr-10",
          "focus:border-red-400/60 focus:shadow-red-400/20 focus:shadow-md",
          "font-mono placeholder:text-red-400/50",
          "hover:border-red-400/50 hover:shadow-red-400/10 hover:shadow-sm",
          "relative before:absolute before:inset-0 before:rounded-md",
          "before:bg-gradient-to-r before:from-red-400/0 before:via-red-400/20 before:to-red-400/0",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "focus:before:opacity-100",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md border-white/20 text-white pr-10",
          "focus:border-white/40 focus:shadow-white/10 focus:shadow-md",
          "placeholder:text-white/50",
          "hover:border-white/30 hover:shadow-white/5 hover:shadow-sm",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "",
        holographic: "text-cyan-400 font-mono uppercase tracking-wider",
        "holographic-secondary": "text-slate-400 font-mono uppercase tracking-wider",
        "holographic-destructive": "text-red-400 font-mono uppercase tracking-wider",
        glass: "text-white font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const buttonVariants = cva(
  "absolute top-1/2 right-2 size-6 -translate-y-1/2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        holographic: [
          "text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-400/20",
          "focus-visible:ring-cyan-400/50 focus-visible:bg-cyan-400/30",
          "transition-all duration-200",
        ],
        "holographic-secondary": [
          "text-slate-400/70 hover:text-slate-400 hover:bg-slate-400/20",
          "focus-visible:ring-slate-400/50 focus-visible:bg-slate-400/30",
          "transition-all duration-200",
        ],
        "holographic-destructive": [
          "text-red-400/70 hover:text-red-400 hover:bg-red-400/20",
          "focus-visible:ring-red-400/50 focus-visible:bg-red-400/30",
          "transition-all duration-200",
        ],
        glass: [
          "text-white/70 hover:text-white hover:bg-white/20",
          "focus-visible:ring-white/50 focus-visible:bg-white/30",
          "transition-all duration-200",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCalendarDate(date: CalendarDate | undefined) {
  if (!date) {
    return "";
  }
  // Convert CalendarDate to Date for formatting
  const jsDate = new Date(date.year, date.month - 1, date.day);
  return formatDate(jsDate);
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

function calendarDateToDate(calendarDate: CalendarDate): Date {
  return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
}

function dateToCalendarDate(date: Date): CalendarDate {
  return {
    calendar: { identifier: "gregory" } as any,
    era: "AD" as any,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  } as CalendarDate;
}

export interface DatePickerProps extends VariantProps<typeof datePickerVariants> {
  label?: string;
  placeholder?: string;
  value?: CalendarDate | Date;
  defaultValue?: CalendarDate | Date;
  onChange?: (date: CalendarDate) => void;
  disabled?: boolean;
  isRequired?: boolean;
  showMonthAndYearPickers?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  label = "Date",
  placeholder,
  value,
  defaultValue,
  onChange,
  disabled = false,
  isRequired = false,
  showMonthAndYearPickers = false,
  variant = "default",
  className,
  id,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Handle both CalendarDate and Date inputs
  const getInitialDate = (): Date | undefined => {
    if (value) {
      return value instanceof Date ? value : calendarDateToDate(value);
    }
    if (defaultValue) {
      return defaultValue instanceof Date ? defaultValue : calendarDateToDate(defaultValue);
    }
    return undefined;
  };

  const [date, setDate] = React.useState<Date | undefined>(getInitialDate);
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [inputValue, setInputValue] = React.useState(formatDate(date));

  // Update internal state when value prop changes
  React.useEffect(() => {
    const newDate = getInitialDate();
    setDate(newDate);
    setMonth(newDate);
    setInputValue(formatDate(newDate));
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setInputValue(formatDate(selectedDate));
      setOpen(false);

      if (onChange) {
        onChange(dateToCalendarDate(selectedDate));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsedDate = new Date(newValue);
    if (isValidDate(parsedDate)) {
      setDate(parsedDate);
      setMonth(parsedDate);

      if (onChange) {
        onChange(dateToCalendarDate(parsedDate));
      }
    }
  };

  return (
    <div className={cn(datePickerVariants({ variant }), className)} {...props}>
      <div className="flex flex-col gap-3 w-full">
        {label && (
          <Label
            htmlFor={id || "date"}
            className={cn(
              labelVariants({ variant }),
              "px-1",
              isRequired && "after:content-['*'] after:ml-1 after:text-red-500",
            )}
          >
            {label}
          </Label>
        )}
        <div className="relative flex gap-2">
          <Input
            id={id || "date"}
            value={inputValue}
            placeholder={placeholder || formatDate(new Date())}
            disabled={disabled}
            className={cn(inputVariants({ variant }))}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
              }
            }}
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={`${id || "date"}-picker`}
                variant="ghost"
                disabled={disabled}
                className={cn(buttonVariants({ variant }))}
              >
                <CalendarIcon className="size-3.5" />
                <span className="sr-only">Select date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="end" alignOffset={-8} sideOffset={10}>
              <Calendar
                mode="single"
                selected={date}
                captionLayout={showMonthAndYearPickers ? "dropdown" : "label"}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleDateSelect}
                variant={variant}
                disabled={disabled}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}