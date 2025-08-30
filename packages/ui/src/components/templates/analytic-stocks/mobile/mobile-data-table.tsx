import type { TransformedStockData } from "@repo/ui/types/stock";

import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { COLUMN_LABELS } from "@repo/ui/lib/stock-utils";
import { Card } from "@repo/ui/components/atoms/card";
import { Button } from "@repo/ui/components/atoms/button";

interface MobileDataTableProps {
  data: TransformedStockData[];
}

const MobileDataTable: React.FC<MobileDataTableProps> = ({ data }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Core columns always visible
  const coreColumns = [
    { key: "date", label: COLUMN_LABELS.date },
    { key: "closePrice", label: COLUMN_LABELS.closePrice },
    { key: "priceChange", label: COLUMN_LABELS.change },
  ];

  // Additional columns shown when expanded
  const expandedColumns = [
    { key: "volume", label: COLUMN_LABELS.volume },
    { key: "openPrice", label: COLUMN_LABELS.openPrice },
    { key: "highestPrice", label: COLUMN_LABELS.highestPrice },
    { key: "lowestPrice", label: COLUMN_LABELS.lowestPrice },
  ];

  const toggleRow = (date: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const renderValue = (key: string, row: TransformedStockData) => {
    if (key === "priceChange") {
      const value = row[key]?.value;
      const percentage = row[key]?.percentage;
      const colorClass = value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-warning";

      return (
        <span className={colorClass}>
          {value?.toFixed(2)} ({percentage?.toFixed(2)}%)
        </span>
      );
    }

    if (key === "volume") {
      return row[key].toLocaleString();
    }

    if (key === "closePrice" || key === "openPrice" || key === "highestPrice" || key === "lowestPrice") {
      return row[key]?.toFixed(2);
    }

    return row[key];
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Header Card */}
      <Card>
        <div className="grid grid-cols-4 gap-2 py-2">
          <div className="col-span-1" />
          {coreColumns.map((column) => (
            <div key={column.key} className="font-medium text-sm">
              {column.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Data Rows */}
      {data.map((row, index) => (
        <Card key={`${row.date}-${index}`} className="w-full">
          <div className="p-0">
            {/* Main Row */}
            <Button className="w-full px-3 py-4" onClick={() => toggleRow(row.date)}>
              <div className="grid grid-cols-4 gap-2 w-full items-center">
                <div className="flex justify-start">
                  {expandedRows[row.date] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                {coreColumns.map((column) => (
                  <div key={column.key} className="text-sm text-left overflow-hidden text-ellipsis">
                    {renderValue(column.key, row)}
                  </div>
                ))}
              </div>
            </Button>

            {/* Expanded Content */}
            {expandedRows[row.date] && (
              <div className="px-4 pb-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  {expandedColumns.map((column) => (
                    <div key={column.key} className="text-sm">
                      <span className="font-medium text-default-600">{column.label}:</span>
                      <span className="ml-2">{renderValue(column.key, row)}</span>
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
