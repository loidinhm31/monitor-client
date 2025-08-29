import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { CalendarDate } from "@internationalized/date";
import { Button } from "@repo/ui/components/ui/button";
import { Calendar } from "@repo/ui/components/ui/calendar";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover";

// Helper functions to convert between CalendarDate and Date
function calendarDateToDate(calendarDate: CalendarDate): Date {
  return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
}

function dateToCalendarDate(date: Date): CalendarDate {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function formatCalendarDate(date: CalendarDate): string {
  const jsDate = calendarDateToDate(date);

  return jsDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCalendarDateShort(date: CalendarDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);

  return !isNaN(date.getTime());
}

export interface DatePickerProps {
  value?: CalendarDate;
  onChange?: (date: CalendarDate) => void;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  showMonthAndYearPickers?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label = "Select date",
  placeholder,
  isRequired = false,
  showMonthAndYearPickers = false,
  disabled = false,
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value ? formatCalendarDateShort(value) : "");

  // Convert CalendarDate to Date for the calendar component
  const selectedDate = value ? calendarDateToDate(value) : undefined;
  const [month, setMonth] = React.useState<Date | undefined>(selectedDate || new Date());

  // Update input value when external value changes
  React.useEffect(() => {
    if (value) {
      setInputValue(formatCalendarDateShort(value));
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setInputValue(newValue);

    // Try to parse the input as a date
    if (isValidDateString(newValue)) {
      const parsedDate = new Date(newValue);
      const calendarDate = dateToCalendarDate(parsedDate);

      onChange?.(calendarDate);
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

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label && (
        <Label className="px-1" htmlFor="date-picker-input">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative flex gap-2">
        <Input
          id="date-picker-input"
          className="bg-background pr-10"
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
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              id="date-picker-trigger"
              variant="ghost"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" alignOffset={-8} className="w-auto overflow-hidden p-0" sideOffset={10}>
            <Calendar
              captionLayout={showMonthAndYearPickers ? "dropdown" : "label"}
              mode="single"
              month={month}
              selected={selectedDate}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}