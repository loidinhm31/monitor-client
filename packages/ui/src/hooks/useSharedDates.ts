import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { useState } from "react";
import { TimeframeOption } from "@repo/ui/types/stock";

export const useSharedDates = () => {
  const currentDate = today(getLocalTimeZone());
  const threeMonthsAgo = currentDate.subtract({ months: 3 });

  const [startDate, setStartDate] = useState<CalendarDate>(threeMonthsAgo);
  const [endDate, setEndDate] = useState<CalendarDate>(currentDate);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("ALL");

  const formatDateForApi = (date: CalendarDate): string => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  };

  return {
    startDate,
    endDate,
    timeframe,
    setStartDate,
    setEndDate,
    setTimeframe,
    formatDateForApi,
    currentDate,
  };
};
