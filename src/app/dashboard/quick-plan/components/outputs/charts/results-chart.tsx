'use client';

import { useTheme } from 'next-themes';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import { ChartDataPoint } from '@/lib/calc/fire-analysis';
import { useFIREChartData, useFIREAnalysis } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  if (!(active && payload && payload.length)) return null;

  return (
    <div className="text-foreground rounded-lg border bg-rose-100 p-3 shadow-md dark:bg-rose-900">
      <p className="mb-1 text-sm font-medium">Age {label}</p>
      <p className="text-sm">
        Portfolio Value:
        <span className="ml-1 font-medium">{formatNumber(payload[0].value)}</span>
      </p>
    </div>
  );
};

export function ResultsChart() {
  const { theme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartData = useFIREChartData();
  const fireAnalysis = useFIREAnalysis();

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = theme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = theme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = theme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600
  const primaryColor = theme === 'dark' ? '#fb7185' : '#e11d48'; // rose-400 : rose-600

  const interval = isSmallScreen ? 4 : 3;
  const isAchievable = fireAnalysis.achievable && fireAnalysis.fireAge > 0;

  return (
    <div className="[&_svg:focus]:outline-primary h-64 w-full sm:h-80 lg:h-96 [&_svg:focus]:rounded-lg [&_svg:focus]:outline-2 [&_svg:focus]:outline-offset-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 1)}
          />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="portfolioValue" stroke={primaryColor} fillOpacity={1} fill="url(#colorPortfolio)" />
          {isAchievable && (
            <ReferenceLine
              x={fireAnalysis.fireAge}
              stroke={foregroundColor}
              strokeDasharray="10 5"
              label={{ value: 'FIRE', position: 'insideBottomLeft', fill: foregroundColor }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
