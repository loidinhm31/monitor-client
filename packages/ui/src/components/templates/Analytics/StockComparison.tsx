// import { Button, Input } from "@heroui/react";
// import { Plus } from "lucide-react";
// import React, { useState } from "react";
//
// import ComparisonChart from "@repo/ui/components/templates/Analytics/StockComparisonChart";
//
// interface StockComparisonProps {
//   stocksData: {
//     symbol: string;
//     data: {
//       date: string;
//       closePrice: number;
//     }[];
//   }[];
//   onAddStock: (symbol: string) => void;
//   onRemoveStock: (symbol: string) => void;
//   mainSymbol: string;
// }
//
// const StockComparison: React.FC<StockComparisonProps> = ({ stocksData, onAddStock, onRemoveStock, mainSymbol }) => {
//   const [compareSymbol, setCompareSymbol] = useState("");
//
//   const handleAddStock = async () => {
//     if (!compareSymbol || stocksData.some((s) => s.symbol === compareSymbol)) {
//       return;
//     }
//
//     await onAddStock(compareSymbol);
//     setCompareSymbol("");
//   };
//
//   return (
//     <div className="w-full space-y-4">
//       <div className="flex flex-wrap items-end gap-4">
//         <div className="flex-none w-32">
//           <Input
//             label="Compare with"
//             placeholder="Symbol"
//             size="sm"
//             type="text"
//             value={compareSymbol}
//             variant="bordered"
//             onChange={(e) => setCompareSymbol(e.target.value.toUpperCase())}
//           />
//         </div>
//         <Button
//           color="primary"
//           isDisabled={!compareSymbol || stocksData.some((s) => s.symbol === compareSymbol)}
//           size="lg"
//           startContent={<Plus className="w-4 h-4" />}
//           onClick={handleAddStock}
//         >
//           Add to Compare
//         </Button>
//       </div>
//
//       <ComparisonChart stocksData={stocksData} onRemoveStock={onRemoveStock} />
//     </div>
//   );
// };
//
// export default StockComparison;
