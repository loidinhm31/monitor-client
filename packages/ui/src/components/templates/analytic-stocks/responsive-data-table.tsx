import { Column, DataRow } from "@repo/ui/types/stock";
import React, { useEffect, useState } from "react";
import MobileDataTable from "@repo/ui/components/templates/analytic-stocks/mobile/mobile-data-table";
import DataTable from "@repo/ui/components/templates/analytic-stocks/data-table";

interface ResponsiveDataTableProps {
  isPortfolio?: boolean;
  data: DataRow[];
  columns: Column[];
  onRemoveStock?: (symbol: string) => void;
}

const ResponsiveDataTable: React.FC<ResponsiveDataTableProps> = ({
  data,
  columns,
  onRemoveStock,
  isPortfolio = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="w-full">
      {isMobile ? (
        <MobileDataTable columns={columns} data={data} isPortfolio={isPortfolio} onRemoveStock={onRemoveStock} />
      ) : (
        <DataTable columns={columns} data={data} onRemoveStock={onRemoveStock} />
      )}
    </div>
  );
};

export default ResponsiveDataTable;
