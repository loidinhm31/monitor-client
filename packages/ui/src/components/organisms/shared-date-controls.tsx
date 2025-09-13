import { CalendarDate } from "@internationalized/date";
import { DatePicker } from "@repo/ui/components/atoms/date-picker";
import { Label } from "@repo/ui/components/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/atoms/select";
import { AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import React from "react";
import { ResolutionOption, TimeframeOption } from "@repo/ui/types/stock";

export interface DateRange {
  from: CalendarDate;
  to: CalendarDate;
}

interface SharedDateControlsProps {
  startDate: CalendarDate;
  endDate: CalendarDate;
  timeframe: TimeframeOption;
  resolution: ResolutionOption;
  onStartDateChange: (date: CalendarDate) => void;
  onEndDateChange: (date: CalendarDate) => void;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  onResolutionChange?: (resolution: ResolutionOption) => void;
  onDateRangeChange?: (range: DateRange) => void;
  showDatePickers?: boolean;
  showResolution?: boolean;
  disabled?: boolean;
  className?: string;
  currentSymbol?: string; // Add this prop to determine if it's VNGOLD
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
  currentSymbol,
}) => {
  // Check if current symbol is Vietnamese Gold
  const isVNGold = currentSymbol === "VNGOLD";
  const resolutionDisabled = disabled || isVNGold;

  const handleResolutionChange = (newResolution: ResolutionOption) => {
    if (onResolutionChange && !resolutionDisabled) {
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
          <Label className="text-cyan-400/70 text-sm font-medium mb-2 block">
            Resolution
            {isVNGold && <span className="ml-2 text-xs text-amber-400/70">(Gold: 1D Only)</span>}
          </Label>
          <Select
            disabled={resolutionDisabled}
            value={isVNGold ? "1D" : resolution}
            onValueChange={handleResolutionChange}
          >
            <SelectTrigger className={cn("w-full", isVNGold && "opacity-60 cursor-not-allowed")} variant="holographic">
              <TrendingUp className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Resolution" />
            </SelectTrigger>
            <SelectContent variant="holographic">
              <SelectItem value="1D">Daily (1D)</SelectItem>
              {!isVNGold && (
                <>
                  <SelectItem value="1W">Weekly (1W)</SelectItem>
                  <SelectItem value="1M">Monthly (1M)</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          {isVNGold && (
            <div className="flex items-center mt-1 text-xs text-amber-400/70">
              <AlertCircle className="w-3 h-3 mr-1" />
              Vietnamese Gold data only supports daily resolution
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-w-48">
        <Label className="text-cyan-400/70 text-sm font-medium font-mono mb-2 block">Quick Timeframe</Label>
        <Select disabled={disabled} value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-32" variant="holographic">
            <SelectValue placeholder="Timeframe" />
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
