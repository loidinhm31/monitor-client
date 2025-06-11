import type { ChartProps } from "@/types/stock";

import React from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PriceChart: React.FC<ChartProps> = ({ data }) => {
  console.log("jsonData", data);

  return (
    <div className="w-full h-[400px] mt-4">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line dataKey="closePrice" dot={false} name="Close Price" stroke="#0072F5" type="monotone" />
          <Line dataKey="openPrice" dot={false} name="Open Price" stroke="#17C964" type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
