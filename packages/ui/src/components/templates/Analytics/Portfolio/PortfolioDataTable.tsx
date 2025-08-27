// import type { TransformedStockData } from "@repo/ui/types/stock";
//
// import { Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
// import { Trash2 } from "lucide-react";
// import React from "react";
//
// import { COLUMN_LABELS } from "@repo/ui/utils/stockUtils";
//
// interface PortfolioDataTableProps {
//   data: (TransformedStockData & { symbol: string })[];
//   onRemoveStock: (symbol: string) => void;
//   actionColumn?: boolean;
// }
//
// const PortfolioDataTable: React.FC<PortfolioDataTableProps> = ({ data, onRemoveStock, actionColumn = true }) => {
//   const columns = [
//     { key: "symbol", label: "Symbol" },
//     { key: "date", label: COLUMN_LABELS.date },
//     { key: "closePrice", label: COLUMN_LABELS.closePrice },
//     { key: "priceChange", label: COLUMN_LABELS.change },
//     { key: "volume", label: COLUMN_LABELS.volume },
//     { key: "openPrice", label: COLUMN_LABELS.openPrice },
//     { key: "highestPrice", label: COLUMN_LABELS.highestPrice },
//     { key: "lowestPrice", label: COLUMN_LABELS.lowestPrice },
//     ...(actionColumn ? [{ key: "actions", label: "Actions" }] : []),
//   ];
//
//   const renderCell = (column: { key: string }, row: TransformedStockData & { symbol: string }) => {
//     if (column.key === "actions") {
//       return (
//         <Button isIconOnly color="danger" size="sm" variant="light" onClick={() => onRemoveStock(row.symbol)}>
//           <Trash2 className="w-4 h-4" />
//         </Button>
//       );
//     }
//
//     if (column.key === "priceChange") {
//       const value = row[column.key]?.value;
//       const percentage = row[column.key]?.percentage;
//
//       let colorClass = "text-warning";
//
//       if (value > 0) {
//         colorClass = "text-success";
//       } else if (value < 0) {
//         colorClass = "text-danger";
//       }
//
//       return (
//         <span className={colorClass}>
//           {value?.toFixed(2)} ({percentage?.toFixed(2)}%)
//         </span>
//       );
//     }
//
//     if (column.key === "volume") {
//       return row[column.key].toLocaleString();
//     }
//
//     if (["closePrice", "openPrice", "highestPrice", "lowestPrice"].includes(column.key)) {
//       return row[column.key]?.toFixed(2);
//     }
//
//     return row[column.key];
//   };
//
//   return (
//     <Table removeWrapper aria-label="Portfolio data table" className="mt-4">
//       <TableHeader>
//         {columns.map((column) => (
//           <TableColumn key={column.key}>{column.label}</TableColumn>
//         ))}
//       </TableHeader>
//       <TableBody>
//         {data.map((row, index) => (
//           <TableRow key={`${row.symbol}-${index}`}>
//             {columns.map((column) => (
//               <TableCell key={column.key}>{renderCell(column, row)}</TableCell>
//             ))}
//           </TableRow>
//         ))}
//       </TableBody>
//     </Table>
//   );
// };
//
// export default PortfolioDataTable;
