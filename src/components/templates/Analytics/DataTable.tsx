import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import { COLUMN_LABELS } from '@/utils/stockUtils';
import type { TransformedStockData } from '@/types/stock';

interface DataTableProps {
  data: TransformedStockData[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const columns = [
    { key: 'date', label: COLUMN_LABELS.date },
    { key: 'closePrice', label: COLUMN_LABELS.closePrice },
    { key: 'priceChange', label: COLUMN_LABELS.change },
    { key: 'volume', label: COLUMN_LABELS.volume },
    { key: 'openPrice', label: COLUMN_LABELS.openPrice },
    { key: 'highestPrice', label: COLUMN_LABELS.highestPrice },
    { key: 'lowestPrice', label: COLUMN_LABELS.lowestPrice },
  ];

  return (
    <Table
      aria-label="Stock data table"
      className="mt-4"
      removeWrapper
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn key={column.key}>{column.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column.key}>
                {column.key === 'volume'
                  ? row[column.key].toLocaleString()
                  : column.key === 'priceChange' ? `${row[column.key]?.value} (${row[column.key]?.percentage}%)` : row[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DataTable;