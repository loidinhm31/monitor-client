import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ChartProps } from "@/types/stock";

const VolumeChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[400px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="volume" fill="#7828C8" name="Trading Volume" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VolumeChart;
