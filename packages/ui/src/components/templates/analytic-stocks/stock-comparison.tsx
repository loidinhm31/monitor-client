import { Button } from "@repo/ui/components/atoms/button";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import ComparisonChart from "@repo/ui/components/templates/analytic-stocks/stock-comparison-chart";
import { InputLabel } from "@repo/ui/components/atoms/input-label";

interface StockComparisonProps {
  stocksData: {
    symbol: string;
    data: {
      date: string;
      closePrice: number;
    }[];
  }[];
  onAddStock: (symbol: string) => void;
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
          <InputLabel
            label="Compare with"
            placeholder="Symbol"
            type="text"
            value={compareSymbol}
            variant="holographic"
            onChange={(e) => setCompareSymbol(e.target.value.toUpperCase())}
          />
        </div>
        <Button
          disabled={!compareSymbol || stocksData.some((s) => s.symbol === compareSymbol)}
          size="lg"
          variant="holographic"
          onClick={handleAddStock}
        >
          <Plus className="w-4 h-4" />
          Add to Compare
        </Button>
      </div>

      <ComparisonChart stocksData={stocksData} onRemoveStock={onRemoveStock} />
    </div>
  );
};

export default StockComparison;
