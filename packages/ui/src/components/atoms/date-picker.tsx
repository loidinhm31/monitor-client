import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { Calendar } from "@repo/ui/components/atoms/calendar";
import { Button } from "@repo/ui/components/atoms/button";
import { Input } from "@repo/ui/components/atoms/input";
import { Label } from "@repo/ui/components/atoms/label";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/atoms/popover";
import { cn } from "@repo/ui/lib/utils";

// Helper functions for date formatting (assuming CalendarDate type exists)
interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const formatCalendarDate = (date: CalendarDate): string => {
  return new Date(date.year, date.month - 1, date.day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCalendarDateShort = (date: CalendarDate): string => {
  return new Date(date.year, date.month - 1, date.day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const dateToCalendarDate = (date: Date): CalendarDate => {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

const calendarDateToDate = (calendarDate: CalendarDate): Date => {
  return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
};

const datePickerVariants = cva("flex flex-col gap-3", {
  variants: {
    variant: {
      default: "",
      holographic: "",
      "holographic-secondary": "",
      "holographic-destructive": "",
      glass: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface DatePickerProps extends VariantProps<typeof datePickerVariants> {
  /** Current selected date */
  value?: CalendarDate;
  /** Called when date changes */
  onChange?: (date: CalendarDate) => void;
  /** Label for the date picker */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Show month and year dropdowns in calendar */
  showMonthAndYearPickers?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Error message */
  error?: string;
  /** Description text */
  description?: string;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      label,
      placeholder,
      isRequired = false,
      disabled = false,
      showMonthAndYearPickers = true,
      className,
      variant,
      error,
      description,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [month, setMonth] = React.useState<Date>(value ? calendarDateToDate(value) : new Date());

    // Convert CalendarDate to Date for react-day-picker
    const selectedDate = value ? calendarDateToDate(value) : undefined;

    // Update input value when value prop changes
    React.useEffect(() => {
      if (value) {
        setInputValue(formatCalendarDateShort(value));
        setMonth(calendarDateToDate(value));
      } else {
        setInputValue("");
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Try to parse the date
      const parsedDate = new Date(newValue);
      if (!isNaN(parsedDate.getTime()) && onChange) {
        const calendarDate = dateToCalendarDate(parsedDate);
        onChange(calendarDate);
        setMonth(parsedDate);
      }
    };

    const handleDateSelect = (date: Date | undefined) => {
      if (date && onChange) {
        const calendarDate = dateToCalendarDate(date);
        onChange(calendarDate);
        setInputValue(formatCalendarDateShort(calendarDate));
        setOpen(false);
      }
    };

    const displayPlaceholder = placeholder || formatCalendarDate(new CalendarDate(2025, 6, 1));

    // Get appropriate input variant based on date picker variant
    const getInputVariant = () => {
      return variant as any; // This will match the input variants
    };

    // Get appropriate button variant
    const getButtonVariant = () => {
      if (variant?.includes("holographic")) {
        return variant as "holographic" | "holographic-secondary" | "holographic-destructive";
      }
      return "ghost";
    };

    // Get appropriate popover variant
    const getPopoverVariant = () => {
      return variant as any;
    };

    // Get appropriate label classes
    const getLabelClasses = () => {
      switch (variant) {
        case "holographic":
          return "text-cyan-400 font-mono uppercase tracking-wider";
        case "holographic-secondary":
          return "text-slate-400 font-mono uppercase tracking-wider";
        case "holographic-destructive":
          return "text-red-400 font-mono uppercase tracking-wider";
        case "glass":
          return "text-white font-semibold";
        default:
          return "";
      }
    };

    // Get appropriate description classes
    const getDescriptionClasses = () => {
      switch (variant) {
        case "holographic":
          return "text-cyan-400/70 font-mono text-xs";
        case "holographic-secondary":
          return "text-slate-400/70 font-mono text-xs";
        case "holographic-destructive":
          return "text-red-400/70 font-mono text-xs";
        case "glass":
          return "text-white/70 text-xs";
        default:
          return "text-muted-foreground text-xs";
      }
    };

    // Get appropriate error classes
    const getErrorClasses = () => {
      return variant?.includes("holographic") ? "text-red-400 font-mono text-xs" : "text-red-500 text-xs";
    };

    return (
      <div ref={ref} className={cn(datePickerVariants({ variant }), className)} {...props}>
        {label && (
          <Label className={cn("px-1", getLabelClasses())} htmlFor="date-picker-input">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </Label>
        )}

        <div className="relative flex gap-2">
          <Input
            id="date-picker-input"
            variant={getInputVariant()}
            className="pr-10"
            placeholder={displayPlaceholder}
            value={inputValue}
            disabled={disabled}
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
                variant={getButtonVariant()}
                size="icon"
                className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2"
                id="date-picker-trigger"
                disabled={disabled}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span className="sr-only">Select date</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              alignOffset={-8}
              className="w-auto overflow-hidden p-0"
              sideOffset={10}
              variant={getPopoverVariant()}
            >
              <Calendar
                variant={variant as any}
                captionLayout={showMonthAndYearPickers ? "dropdown" : "label"}
                mode="single"
                month={month}
                selected={selectedDate}
                onMonthChange={setMonth}
                onSelect={handleDateSelect}
                buttonVariant={getButtonVariant()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {description && <p className={getDescriptionClasses()}>{description}</p>}

        {error && <p className={getErrorClasses()}>{error}</p>}
      </div>
    );
  },
);

DatePicker.displayName = "DatePicker";

export {
  DatePicker,
  datePickerVariants,
  type CalendarDate,
  formatCalendarDate,
  formatCalendarDateShort,
  dateToCalendarDate,
  calendarDateToDate,
};
