import { CalendarDate } from "@internationalized/date";

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const getOrdinalSuffix = (day: number): string => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
};

export const formatCustomDate = (date: CalendarDate): string => {
  const day = date.day;
  const month = months[date.month - 1];
  return `${date.year}, ${day}${getOrdinalSuffix(day)}, ${month}`;
};