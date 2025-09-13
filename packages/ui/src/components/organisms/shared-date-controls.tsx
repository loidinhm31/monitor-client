import React, { useState } from "react";
import { ResolutionOption, TimeframeOption } from "@repo/ui/types/stock";
import { CalendarDate } from "@internationalized/date";
import { Calendar } from "@repo/ui/components/atoms/calendar";
import { Button } from "@repo/ui/components/atoms/button";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/atoms/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/atoms/select";
import { Label } from "@repo/ui/components/atoms/label";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { DatePicker } from "@repo/ui/components/atoms/date-picker";

interface DateRange {
  from: CalendarDate;
  to: CalendarDate;
}

interface SharedDateControlsProps {
  startDate: CalendarDate;
  endDate: CalendarDate;
  timeframe: TimeframeOption;
  resolution?: ResolutionOption;
  onStartDateChange: (date: CalendarDate) => void;
  onEndDateChange: (date: CalendarDate) => void;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  onResolutionChange?: (resolution: ResolutionOption) => void;
  onDateRangeChange?: (range: DateRange) => void;
  showDatePickers?: boolean;
  showResolution?: boolean;
  disabled?: boolean;
  className?: string;
}

const formatCustomDate = (date: CalendarDate): string => {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
};

// Helper function to convert CalendarDate to Date for calendar component
const calendarDateToDate = (calendarDate: CalendarDate): Date => {
  return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
};

// Helper function to convert Date to CalendarDate
const dateToCalendarDate = (date: Date): CalendarDate => {
  return {
    calendar: { identifier: "gregory" } as any,
    era: "AD" as any,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  } as CalendarDate;
};

const SharedDateControls: React.FC<SharedDateControlsProps> = ({
  startDate,
  endDate,
  timeframe,
  resolution = "1D",
  onStartDateChange,
  onEndDateChange,
  onTimeframeChange,
  onResolutionChange,
  onDateRangeChange,
  showDatePickers = true,
  showResolution = true,
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: calendarDateToDate(startDate),
    to: calendarDateToDate(endDate),
  });

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);

    if (range.from && range.to) {
      const newStartDate = dateToCalendarDate(range.from);
      const newEndDate = dateToCalendarDate(range.to);

      onStartDateChange(newStartDate);
      onEndDateChange(newEndDate);

      if (onDateRangeChange) {
        onDateRangeChange({
          from: newStartDate,
          to: newEndDate,
        });
      }

      setOpen(false);
    }
  };

  const handleResolutionChange = (newResolution: ResolutionOption) => {
    if (onResolutionChange) {
      onResolutionChange(newResolution);
    }
  };

  return (
    <div className={`flex flex-wrap items-end gap-4 ${className}`}>
      {showDatePickers && (
        <>
          <div className="flex-none w-48">
            <DatePicker
              isRequired
              showMonthAndYearPickers
              disabled={disabled}
              label="Start Date"
              placeholder={formatCustomDate(startDate)}
              value={startDate}
              variant="holographic"
              onChange={onStartDateChange}
            />
          </div>
          <div className="flex-none w-48">
            <DatePicker
              isRequired
              showMonthAndYearPickers
              disabled={disabled}
              label="End Date"
              placeholder={formatCustomDate(endDate)}
              value={endDate}
              variant="holographic"
              onChange={onEndDateChange}
            />
          </div>
        </>
      )}

      {showResolution && (
        <div className="flex-none w-40">
          <Label className="text-cyan-400/70 text-sm font-medium mb-2 block">Resolution</Label>
          <Select disabled={disabled} value={resolution} onValueChange={handleResolutionChange}>
            <SelectTrigger className="w-full" variant="holographic">
              <TrendingUp className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Resolution" />
            </SelectTrigger>
            <SelectContent variant="holographic">
              <SelectItem value="1D">Daily (1D)</SelectItem>
              <SelectItem value="60">Hourly (1H)</SelectItem>
              <SelectItem value="30">30 Minutes</SelectItem>
              <SelectItem value="15">15 Minutes</SelectItem>
              <SelectItem value="10">10 Minutes</SelectItem>
              <SelectItem value="5">5 Minutes</SelectItem>
              <SelectItem value="1">1 Minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1 min-w-48">
        <Label className="text-cyan-400/70 text-sm font-medium mb-2 block">Quick Timeframe</Label>
        <Select disabled={disabled} value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger aria-label="Select timeframe" className="w-full" variant="holographic">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent variant="holographic">
            <SelectItem value="1W">1 Week</SelectItem>
            <SelectItem value="1M">1 Month</SelectItem>
            <SelectItem value="3M">3 Months</SelectItem>
            <SelectItem value="6M">6 Months</SelectItem>
            <SelectItem value="1Y">1 Year</SelectItem>
            <SelectItem value="2Y">2 Years</SelectItem>
            <SelectItem value="ALL">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SharedDateControls;