// import type { TransformedStockData } from "@/types/stock";
//
// import React, { useEffect, useState } from "react";
//
// import DataTable from "@/components/templates/Analytics/DataTable";
// import MobileDataTable from "@/components/templates/Analytics/mobile/MobileDataTable";
//
// interface ResponsiveDataTableProps {
//   data: TransformedStockData[];
// }
//
// const ResponsiveDataTable: React.FC<ResponsiveDataTableProps> = ({ data }) => {
//   const [isMobile, setIsMobile] = useState(false);
//
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//
//     // Initial check
//     checkMobile();
//
//     // Add event listener
//     window.addEventListener("resize", checkMobile);
//
//     // Cleanup
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);
//
//   return <div className="w-full">{isMobile ? <MobileDataTable data={data} /> : <DataTable data={data} />}</div>;
// };
//
// export default ResponsiveDataTable;
