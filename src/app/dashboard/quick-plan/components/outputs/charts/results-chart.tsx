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
import { ChartDataPoint } from "@/lib/fire-analysis";
import { useFIREChartData } from "@/lib/stores/quick-plan-store";
import { formatNumber } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof ChartDataPoint;
    payload: ChartDataPoint;
  }>;
  label?: number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="text-foreground bg-background rounded-lg border p-3 shadow-md">
        <p className="mb-1 text-sm font-medium">Age {label}</p>
        <p className="text-sm">
          Portfolio Value:
          <span className="ml-1 font-medium">
            {formatNumber(payload[0].value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function ResultsChart() {
  const { theme } = useTheme();
  const chartData = useFIREChartData();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640); // 640px is sm breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = theme === "dark" ? "#4b5563" : "#d1d5db"; // gray-600 : gray-300

  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} className="text-xs">
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="age" interval={isSmallScreen ? 4 : 3} />
          <YAxis tickFormatter={formatNumber} hide={isSmallScreen} />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Tooltip content={<CustomTooltip />} />
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
