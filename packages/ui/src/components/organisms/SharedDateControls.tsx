import React from "react";

import { TimeframeOption } from "@repo/ui/types/stock";
import { CalendarDate } from "@internationalized/date";
import { DatePicker } from "@repo/ui/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";

interface SharedDateControlsProps {
  startDate: CalendarDate;
  endDate: CalendarDate;
  timeframe: TimeframeOption;
  onStartDateChange: (date: CalendarDate) => void;
  onEndDateChange: (date: CalendarDate) => void;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  showDatePickers?: boolean;
}

const formatCustomDate = (date: CalendarDate): string => {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
};

const SharedDateControls: React.FC<SharedDateControlsProps> = ({
  startDate,
  endDate,
  timeframe,
  onStartDateChange,
  onEndDateChange,
  onTimeframeChange,
  showDatePickers = true,
}) => {
  return (
    <div className="flex flex-wrap items-end gap-4">
      {showDatePickers && (
        <>
          <div className="flex-none w-48">
            <DatePicker
              isRequired
              showMonthAndYearPickers
              label={`Start Date (${formatCustomDate(startDate)})`}
              value={startDate}
              onChange={onStartDateChange}
            />
          </div>
          <div className="flex-none w-48">
            <DatePicker
              isRequired
              showMonthAndYearPickers
              label={`End Date (${formatCustomDate(endDate)})`}
              value={endDate}
              onChange={onEndDateChange}
            />
          </div>
        </>
      )}
      <div className="flex w-full">
        <Select 
          value={timeframe} 
          onValueChange={onTimeframeChange}
        >
          <SelectTrigger className="w-full" aria-label="Select timeframe">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
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
