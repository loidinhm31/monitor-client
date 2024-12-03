import React, { useEffect, useState } from "react";

import PortfolioMobileDataTable from "@/components/templates/Analytics/mobile/PortfolioMobileDataTable";
import PortfolioDataTable from "@/components/templates/Analytics/Portfolio/PortfolioDataTable";
import type { TransformedStockData } from "@/types/stock";

interface ResponsivePortfolioDataTableProps {
  data: (TransformedStockData & { symbol: string })[];
  onRemoveStock: (symbol: string) => void;
  actionColumn?: boolean;
}

const ResponsivePortfolioDataTable: React.FC<ResponsivePortfolioDataTableProps> = ({
  data,
  onRemoveStock,
  actionColumn = true,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="w-full">
      {isMobile ? (
        <PortfolioMobileDataTable data={data} onRemoveStock={onRemoveStock} actionColumn={actionColumn} />
      ) : (
        <PortfolioDataTable data={data} onRemoveStock={onRemoveStock} actionColumn={actionColumn} />
      )}
    </div>
  );
};

export default ResponsivePortfolioDataTable;
