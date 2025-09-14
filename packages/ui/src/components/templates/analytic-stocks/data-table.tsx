import { Column, DataRow } from "@repo/ui/types/stock";
import { Trash2 } from "lucide-react";
import React from "react";
import { Button } from "@repo/ui/components/atoms/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/atoms/table";

interface DataTableProps {
  data: DataRow[];
  onRemoveStock?: (symbol: string) => void;
  columns: Column[];
}

const DataTable: React.FC<DataTableProps> = ({ data, onRemoveStock, columns }) => {
  const renderCell = (column: Column, row: DataRow): React.ReactNode => {
    if (column.key === "actions") {
      return (
        <Button size="sm" variant="holographic-destructive" onClick={() => onRemoveStock!(row.symbol!)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      );
    }

    if (column.key === "priceChange") {
      const priceChangeData = row[column.key];
      const value = priceChangeData?.value;
      const percentage = priceChangeData?.percentage;

      let colorClass = "text-yellow-400";

      if (value > 0) {
        colorClass = "text-green-400";
      } else if (value < 0) {
        colorClass = "text-red-400";
      }

      return (
        <span className={colorClass}>
          {value?.toFixed(2)} ({percentage?.toFixed(2)}%)
        </span>
      );
    }

    if (column.key === "volume") {
      const volume = row[column.key as keyof DataRow] as number;

      return <span className="text-cyan-400">{volume.toLocaleString()}</span>;
    }

    const value = row[column.key as keyof DataRow];

    if (typeof value === "number") {
      return <span className="text-cyan-400">{value.toString()}</span>;
    }

    if (value instanceof Date) {
      return <span className="text-cyan-400">{value.toLocaleDateString()}</span>;
    }

    return <span className="text-cyan-400">{String(value ?? "")}</span>;
  };

  return (
    <Table aria-label="Portfolio data table" className="mt-4">
      <TableHeader>
        {columns.map((column) => (
          <TableHead key={column.key} className="text-cyan-200">
            {column.label}
          </TableHead>
        ))}
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={`${row.symbol}-${index}`}>
            {columns.map((column) => (
              <TableCell key={column.key}>{renderCell(column, row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DataTable;
