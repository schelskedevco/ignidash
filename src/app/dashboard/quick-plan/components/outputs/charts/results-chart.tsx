"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartDataPoint } from "@/lib/fire-analysis";
import {
  useFIREChartData,
  useFIREAnalysis,
} from "@/lib/stores/quick-plan-store";
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
      <div className="text-foreground rounded-lg border bg-rose-100 p-3 shadow-md dark:bg-rose-900">
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
  const fireAnalysis = useFIREAnalysis();
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
  const foregroundColor = theme === "dark" ? "#f3f4f6" : "#111827"; // gray-100 : gray-900
  const foregroundMutedColor = theme === "dark" ? "#d1d5db" : "#4b5563"; // gray-300 : gray-600

  const interval = isSmallScreen ? 4 : 3;

  return (
    <div className="h-64 w-full sm:h-80 lg:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} className="text-xs">
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            dataKey="age"
            interval={interval}
          />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number, _index: number) =>
              formatNumber(value, 1)
            }
          />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="portfolioValue"
            stroke="#e11d48"
            fillOpacity={1}
            fill="url(#colorPortfolio)"
          />
          {fireAnalysis.achievable && fireAnalysis.fireAge > 0 && (
            <ReferenceLine
              x={fireAnalysis.fireAge}
              stroke={foregroundColor}
              strokeDasharray="10 5"
              label={{
                value: "FIRE Age",
                position: "insideBottomLeft",
                fill: foregroundColor,
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
