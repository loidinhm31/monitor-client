// import type { TransformedStockData } from "@/types/stock";
//
// import { Button, Card, CardBody } from "@heroui/react";
// import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
// import React, { useState } from "react";
//
// import { COLUMN_LABELS } from "@/utils/stockUtils";
//
// interface PortfolioMobileDataTableProps {
//   data: (TransformedStockData & { symbol: string })[];
//   onRemoveStock: (symbol: string) => void;
//   actionColumn?: boolean;
// }
//
// const PortfolioMobileDataTable: React.FC<PortfolioMobileDataTableProps> = ({
//   data,
//   onRemoveStock,
//   actionColumn = true,
// }) => {
//   const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
//
//   // Core columns always visible
//   const coreColumns = [
//     { key: "symbol", label: "Symbol" },
//     { key: "closePrice", label: COLUMN_LABELS.closePrice },
//     { key: "priceChange", label: COLUMN_LABELS.change },
//   ];
//
//   // Additional columns shown when expanded
//   const expandedColumns = [
//     { key: "volume", label: COLUMN_LABELS.volume },
//     { key: "openPrice", label: COLUMN_LABELS.openPrice },
//     { key: "highestPrice", label: COLUMN_LABELS.highestPrice },
//     { key: "lowestPrice", label: COLUMN_LABELS.lowestPrice },
//   ];
//
//   const toggleRow = (key: string) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };
//
//   const renderValue = (key: string, row: TransformedStockData & { symbol: string }) => {
//     if (key === "priceChange") {
//       const value = row[key]?.value;
//       const percentage = row[key]?.percentage;
//       const colorClass = value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-warning";
//
//       return (
//         <span className={colorClass}>
//           {value?.toFixed(2)} ({percentage?.toFixed(2)}%)
//         </span>
//       );
//     }
//
//     if (key === "volume") {
//       return row[key].toLocaleString();
//     }
//
//     if (["closePrice", "openPrice", "highestPrice", "lowestPrice"].includes(key)) {
//       return row[key]?.toFixed(2);
//     }
//
//     return row[key];
//   };
//
//   return (
//     <div className="flex flex-col gap-2 w-full">
//       {/* Header Card */}
//       <Card>
//         <CardBody className="grid grid-cols-4 gap-2 py-2">
//           <div className="col-span-1" />
//           {coreColumns.map((column) => (
//             <div key={column.key} className="font-medium text-sm">
//               {column.label}
//             </div>
//           ))}
//         </CardBody>
//       </Card>
//
//       {/* Data Rows */}
//       {data.map((row, index) => (
//         <Card key={`${row.symbol}-${row.date}-${index}`} className="w-full">
//           <CardBody className="p-0">
//             {/* Main Row */}
//             <div className="flex w-full">
//               <Button
//                 className="flex-1 px-3 py-4"
//                 variant="light"
//                 onClick={() => toggleRow(`${row.symbol}-${row.date}`)}
//               >
//                 <div className="grid grid-cols-4 gap-2 w-full items-center">
//                   <div className="flex justify-start">
//                     {expandedRows[`${row.symbol}-${row.date}`] ? (
//                       <ChevronDown className="w-4 h-4" />
//                     ) : (
//                       <ChevronRight className="w-4 h-4" />
//                     )}
//                   </div>
//                   {coreColumns.map((column) => (
//                     <div key={column.key} className="text-sm text-left overflow-hidden text-ellipsis">
//                       {renderValue(column.key, row)}
//                     </div>
//                   ))}
//                 </div>
//               </Button>
//               {actionColumn && (
//                 <Button
//                   isIconOnly
//                   className="m-2"
//                   color="danger"
//                   size="sm"
//                   variant="light"
//                   onClick={() => onRemoveStock(row.symbol)}
//                 >
//                   <Trash2 className="w-4 h-4" />
//                 </Button>
//               )}
//             </div>
//
//             {/* Expanded Content */}
//             {expandedRows[`${row.symbol}-${row.date}`] && (
//               <div className="px-4 pb-4 pt-2">
//                 <div className="grid grid-cols-2 gap-4">
//                   {expandedColumns.map((column) => (
//                     <div key={column.key} className="text-sm">
//                       <span className="font-medium text-default-600">{column.label}:</span>
//                       <span className="ml-2">{renderValue(column.key, row)}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </CardBody>
//         </Card>
//       ))}
//     </div>
//   );
// };
//
// export default PortfolioMobileDataTable;
