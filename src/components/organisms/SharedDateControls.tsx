// import React from "react";
//
// import { TimeframeOption } from "@/types/stock";
//
// interface SharedDateControlsProps {
//   startDate: CalendarDate;
//   endDate: CalendarDate;
//   timeframe: TimeframeOption;
//   onStartDateChange: (date: CalendarDate) => void;
//   onEndDateChange: (date: CalendarDate) => void;
//   onTimeframeChange: (timeframe: TimeframeOption) => void;
//   showDatePickers?: boolean;
// }
//
// const formatCustomDate = (date: CalendarDate): string => {
//   return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
// };
//
// const SharedDateControls: React.FC<SharedDateControlsProps> = ({
//   startDate,
//   endDate,
//   timeframe,
//   onStartDateChange,
//   onEndDateChange,
//   onTimeframeChange,
//   showDatePickers = true,
// }) => {
//   return (
//     <div className="flex flex-wrap items-end gap-4">
//       {showDatePickers && (
//         <>
//           <div className="flex-none w-48">
//             <DatePicker
//               isRequired
//               showMonthAndYearPickers
//               label={`Start Date (${formatCustomDate(startDate)})`}
//               value={startDate}
//               onChange={onStartDateChange}
//             />
//           </div>
//           <div className="flex-none w-48">
//             <DatePicker
//               isRequired
//               showMonthAndYearPickers
//               label={`End Date (${formatCustomDate(endDate)})`}
//               value={endDate}
//               onChange={onEndDateChange}
//             />
//           </div>
//         </>
//       )}
//       <div className="flex w-full">
//         <Select
//           aria-label="Select timeframe"
//           className="w-full"
//           defaultSelectedKeys={[timeframe]}
//           size="sm"
//           variant="faded"
//           onChange={(e) => onTimeframeChange(e.target.value as TimeframeOption)}
//         >
//           <SelectItem key="1W" value="1W">
//             1 Week
//           </SelectItem>
//           <SelectItem key="1M" value="1M">
//             1 Month
//           </SelectItem>
//           <SelectItem key="3M" value="3M">
//             3 Months
//           </SelectItem>
//           <SelectItem key="6M" value="6M">
//             6 Months
//           </SelectItem>
//           <SelectItem key="1Y" value="1Y">
//             1 Year
//           </SelectItem>
//           <SelectItem key="2Y" value="2Y">
//             2 Years
//           </SelectItem>
//           <SelectItem key="ALL" value="ALL">
//             All Time
//           </SelectItem>
//         </Select>
//       </div>
//     </div>
//   );
// };
//
// export default SharedDateControls;
