"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFIREChartData } from "@/lib/stores/quick-plan-store";
import { formatNumber } from "@/lib/utils";

export function ResultsChart() {
  const chartData = useFIREChartData();
  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="age" className="text-muted-foreground text-xs" />
          <YAxis
            tickFormatter={formatNumber}
            className="text-muted-foreground text-xs"
          />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip
            labelFormatter={(age: number) => `Age ${age}`}
            formatter={(value: number) => [
              formatNumber(value),
              "Portfolio Value",
            ]}
          />
          <Area
            type="monotone"
            dataKey="portfolioValue"
            stroke="#e11d48"
            fillOpacity={1}
            fill="url(#colorPortfolio)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
