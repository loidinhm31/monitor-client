import type { TransformedStockData } from "@repo/ui/types/stock";

import React, { useEffect, useState } from "react";

import PortfolioMobileDataTable from "@repo/ui/components/templates/analytic-stocks/mobile/portfolio-mobile-data-table";
import PortfolioDataTable from "@repo/ui/components/templates/analytic-stocks/portfolio/PortfolioDataTable";
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
        <PortfolioMobileDataTable actionColumn={actionColumn} data={data} onRemoveStock={onRemoveStock} />
      ) : (
        <PortfolioDataTable actionColumn={actionColumn} data={data} onRemoveStock={onRemoveStock} />
      )}
    </div>
  );
};

export default ResponsivePortfolioDataTable;
