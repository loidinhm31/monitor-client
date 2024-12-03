import { Button, Card, CardBody, CardHeader, Input, Spinner } from "@nextui-org/react";
import { Plus } from "lucide-react";
import React, { useState } from "react";

import ResponsiveDataTable from "@/components/templates/Analytics/ResponsiveDataTable";
import { TransformedStockData } from "@/types/stock";

interface PortfolioProps {
  data: TransformedStockData[];
  onAddStock: (symbol: string) => Promise<void>;
  loading: boolean;
}

const Portfolio: React.FC<PortfolioProps> = ({ data, onAddStock, loading }) => {
  const [newSymbol, setNewSymbol] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;

    await onAddStock(newSymbol);
    setNewSymbol("");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <h4 className="text-xl font-bold">Portfolio Tracker</h4>
          <p className="text-sm text-default-500">Track your stock portfolio performance</p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="Add stock symbol"
            size="sm"
            className="w-32"
          />
          <Button
            color="primary"
            type="submit"
            isDisabled={loading || !newSymbol}
            startContent={loading ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
          >
            Add
          </Button>
        </form>
      </CardHeader>
      <CardBody>
        {data.length > 0 ? (
          <ResponsiveDataTable data={data} />
        ) : (
          <div className="text-center py-8 text-default-500">
            No stocks in portfolio. Add some stocks to get started.
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Portfolio;
