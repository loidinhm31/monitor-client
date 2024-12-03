import { Button, Input } from "@nextui-org/react";
import { Plus } from "lucide-react";
import React, { useState } from "react";

import ComparisonChart from "@/components/templates/Analytics/StockComparisonChart";

interface StockComparisonProps {
  stocksData: {
    symbol: string;
    data: {
      date: string;
      closePrice: number;
    }[];
  }[];
  onAddStock: (symbol: string) => Promise<void>;
  onRemoveStock: (symbol: string) => void;
  mainSymbol: string;
}

const StockComparison: React.FC<StockComparisonProps> = ({ stocksData, onAddStock, onRemoveStock, mainSymbol }) => {
  const [compareSymbol, setCompareSymbol] = useState("");

  const handleAddStock = async () => {
    if (!compareSymbol || stocksData.some((s) => s.symbol === compareSymbol)) {
      return;
    }

    await onAddStock(compareSymbol);
    setCompareSymbol("");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-none w-32">
          <Input
            type="text"
            label="Compare with"
            value={compareSymbol}
            onChange={(e) => setCompareSymbol(e.target.value.toUpperCase())}
            size="sm"
            variant="bordered"
            placeholder="Symbol"
          />
        </div>
        <Button
          color="primary"
          size="lg"
          startContent={<Plus className="w-4 h-4" />}
          onClick={handleAddStock}
          isDisabled={!compareSymbol || stocksData.some((s) => s.symbol === compareSymbol)}
        >
          Add to Compare
        </Button>
      </div>

      <ComparisonChart stocksData={stocksData} onRemoveStock={onRemoveStock} />
    </div>
  );
};

export default StockComparison;
