'use client';

import { useTheme } from 'next-themes';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import { useMonteCarloChartData, useMonteCarloAnalysis, useCurrentAge } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface StochasticChartDataPoint {
  age: number;
  p10: number;
  p50: number;
  p90: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof StochasticChartDataPoint;
    payload: StochasticChartDataPoint;
  }>;
  label?: number;
  currentAge: number;
}

const CustomTooltip = ({ active, payload, label, currentAge }: CustomTooltipProps) => {
  if (!(active && payload && payload.length)) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - currentAge);

  return (
    <div className="text-foreground bg-background rounded-lg border p-3 shadow-md">
      <p className="border-foreground/50 mb-2 flex justify-between border-b pb-2 text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-2">
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-2)]/60 px-2 text-sm">
          <span className="mr-2">P90:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[0].value, 3)}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-3)]/60 px-2 text-sm">
          <span className="mr-2">Median (P50):</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[1].value, 3)}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-1)]/60 px-2 text-sm">
          <span className="mr-2">P10:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[2].value, 3)}</span>
        </p>
      </div>
    </div>
  );
};

export default function ResultsChart() {
  const { theme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartData = useMonteCarloChartData();
  const fireAnalysis = useMonteCarloAnalysis();
  const currentAge = useCurrentAge();

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = theme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = theme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = theme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  const interval = isSmallScreen ? 4 : 3;
  const showP10ReferenceLine =
    fireAnalysis?.p10FireAge && fireAnalysis?.p50FireAge && fireAnalysis.p10FireAge < fireAnalysis.p50FireAge - 3;
  const showP90ReferenceLine =
    fireAnalysis?.p90FireAge && fireAnalysis?.p50FireAge && fireAnalysis.p90FireAge > 3 + fireAnalysis.p50FireAge;

  return (
    <div className="[&_svg:focus]:outline-primary h-64 w-full sm:h-80 lg:h-96 [&_svg:focus]:rounded-lg [&_svg:focus]:outline-2 [&_svg:focus]:outline-offset-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="colorP10" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={1} />
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
          <Tooltip content={<CustomTooltip currentAge={currentAge!} />} />
          <Area type="monotone" dataKey="p90" stroke="var(--chart-2)" fill="url(#colorP90)" activeDot={false} />
          <Area type="monotone" dataKey="p50" stroke="var(--chart-3)" fill="url(#colorP50)" activeDot={false} />
          <Area type="monotone" dataKey="p10" stroke="var(--chart-1)" fill="url(#colorP10)" activeDot={false} />
          {showP10ReferenceLine && (
            <ReferenceLine
              x={Math.round(fireAnalysis.p10FireAge!)}
              stroke={foregroundColor}
              strokeDasharray="10 5"
              label={{ value: 'P10', position: 'insideBottomLeft', fill: foregroundColor }}
            />
          )}
          {fireAnalysis?.p50FireAge && (
            <ReferenceLine
              x={Math.round(fireAnalysis.p50FireAge)}
              stroke={foregroundColor}
              strokeDasharray="10 5"
              label={{ value: 'P50', position: 'insideBottomLeft', fill: foregroundColor }}
            />
          )}
          {showP90ReferenceLine && (
            <ReferenceLine
              x={Math.round(fireAnalysis.p90FireAge!)}
              stroke={foregroundColor}
              strokeDasharray="10 5"
              label={{ value: 'P90', position: 'insideBottomLeft', fill: foregroundColor }}
            />
          )}
          {fireAnalysis?.requiredPortfolio && (
            <ReferenceLine
              y={Math.round(fireAnalysis.requiredPortfolio)}
              stroke={foregroundColor}
              strokeDasharray="10 5"
              label={{ value: 'Required Portfolio', position: 'insideBottomRight', fill: foregroundColor }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
