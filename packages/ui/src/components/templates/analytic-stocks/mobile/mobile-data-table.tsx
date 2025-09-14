import type { Column, DataRow } from "@repo/ui/types/stock";

import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import React, { useCallback, useState } from "react";
import { Card } from "@repo/ui/components/atoms/card";
import { Button } from "@repo/ui/components/atoms/button";

interface MobileDataTableProps {
  data: DataRow[];
  columns: Column[];
  onRemoveStock?: (symbol: string) => void;
  isPortfolio: boolean;
}

const MobileDataTable: React.FC<MobileDataTableProps> = ({ data, columns, onRemoveStock, isPortfolio }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const actionColumn = useCallback(() => {
    return columns.some((col) => col.key === "actions") && onRemoveStock;
  }, [columns, onRemoveStock]);

  // Core columns always visible
  const coreColumns = columns.filter((col) => {
    if (isPortfolio) {
      return ["symbol", "closePrice", "priceChange"].includes(col.key);
    } else {
      return ["date", "closePrice", "priceChange"].includes(col.key);
    }
  });

  // Additional columns shown when expanded
  const expandedColumns = columns.filter((col) => {
    return ["volume", "openPrice", "highestPrice", "lowestPrice"].includes(col.key);
  });

  const toggleRow = (date: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const renderValue = (column: Column, row: DataRow): React.ReactNode => {
    if (column.key === "priceChange") {
      const value = row[column.key]?.value;
      const percentage = row[column.key]?.percentage;
      const colorClass = value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-warning";

      return (
        <span className={colorClass}>
          {value?.toFixed(2)} ({percentage?.toFixed(2)}%)
        </span>
      );
    }

    if (column.key === "volume") {
      return row[column.key].toLocaleString();
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
    <div className="flex flex-col gap-2 w-full">
      {/* Header Card */}
      <Card variant="holographic">
        <div className="grid grid-cols-4 gap-2 py-2">
          <div className="col-span-1" />
          {coreColumns.map((column) => (
            <div key={column.key} className="font-medium text-sm text-cyan-300">
              {column.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Data Rows */}
      {data.map((row, index) => (
        <Card key={`${row.symbol}-${row.date}-${index}`} className="w-full" variant="holographic">
          <div className="p-0">
            {/* Main Row */}
            <div className="flex w-full">
              <Button
                className="flex-1 px-3 py-4"
                variant="holographic"
                onClick={() => toggleRow(`${row.symbol}-${row.date}`)}
              >
                <div className="grid grid-cols-4 gap-2 w-full items-center">
                  <div className="flex justify-start">
                    {expandedRows[`${row.symbol}-${row.date}`] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  {coreColumns.map((column) => (
                    <div key={column.key} className="text-sm text-left overflow-hidden text-ellipsis">
                      {renderValue(column, row)}
                    </div>
                  ))}
                </div>
              </Button>
              {actionColumn() && (
                <Button
                  className="m-2"
                  size="icon"
                  variant="holographic-destructive"
                  onClick={() => onRemoveStock!(row.symbol!)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Expanded Content */}
            {expandedRows[`${row.symbol}-${row.date}`] && (
              <div className="px-4 pb-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  {expandedColumns.map((column) => (
                    <div key={column.key} className="text-sm">
                      <span className="font-medium text-default-600">{column.label}:</span>
                      <span className="ml-2">{renderValue(column, row)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default MobileDataTable;
