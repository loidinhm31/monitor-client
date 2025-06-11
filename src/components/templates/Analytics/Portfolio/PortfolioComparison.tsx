import { Button, Input } from "@heroui/react";
import { Plus } from "lucide-react";
import React, { useMemo } from "react";

import StockComparisonChart from "@/components/templates/Analytics/StockComparisonChart";

interface PortfolioComparisonProps {
  portfolioData: Array<{
    symbol: string;
    date: string;
    closePrice: number;
  }>;
  onAddStock: (symbol: string) => Promise<void>;
  onRemoveStock: (symbol: string) => void;
  loading?: boolean;
}

const PortfolioComparison: React.FC<PortfolioComparisonProps> = ({
  portfolioData,
  onAddStock,
  onRemoveStock,
  loading = false,
}) => {
  const [compareSymbol, setCompareSymbol] = React.useState("");

  const formattedData = useMemo(() => {
    // Group data by symbol
    const groupedData = portfolioData.reduce(
      (acc, item) => {
        if (!acc[item.symbol]) {
          acc[item.symbol] = {
            symbol: item.symbol,
            data: [],
          };
        }
        acc[item.symbol].data.push({
          date: item.date,
          closePrice: item.closePrice,
        });

        return acc;
      },
      {} as Record<string, { symbol: string; data: Array<{ date: string; closePrice: number }> }>,
    );

    return Object.values(groupedData);
  }, [portfolioData]);

  const handleAddStock = async () => {
    if (!compareSymbol || portfolioData.some((item) => item.symbol === compareSymbol)) {
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
            label="Compare with"
            placeholder="Symbol"
            size="sm"
            type="text"
            value={compareSymbol}
            variant="bordered"
            onChange={(e) => setCompareSymbol(e.target.value.toUpperCase())}
          />
        </div>
        <Button
          color="primary"
          isDisabled={loading || !compareSymbol || portfolioData.some((item) => item.symbol === compareSymbol)}
          size="lg"
          startContent={<Plus className="w-4 h-4" />}
          onClick={handleAddStock}
        >
          Add to Compare
        </Button>
      </div>

      <StockComparisonChart
        description="Compare performance of stocks in your portfolio"
        stocksData={formattedData}
        title="Portfolio Performance Comparison"
        onRemoveStock={onRemoveStock}
      />
    </div>
  );
};

export default PortfolioComparison;
