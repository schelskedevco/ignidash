'use client';

import { useTheme } from 'next-themes';
import { useRef, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import { useCurrentAge, StochasticAnalysis } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface StochasticChartDataPoint {
  age: number;
  p25: number;
  p50: number;
  p75: number;
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
  disabled: boolean;
}

const CustomTooltip = ({ active, payload, label, currentAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - currentAge);

  return (
    <div className="text-foreground bg-background rounded-lg border p-3 shadow-md">
      <p className="border-foreground/50 mb-2 flex justify-between border-b pb-2 text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-2">
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-3)]/60 px-2 text-sm">
          <span className="mr-2">P75:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[0].value, 3, '$')}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-2)]/60 px-2 text-sm">
          <span className="mr-2">P50:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[1].value, 3, '$')}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-1)]/60 px-2 text-sm">
          <span className="mr-2">P25:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[2].value, 3, '$')}</span>
        </p>
      </div>
    </div>
  );
};

interface StochasticResultsChartProps {
  fireAnalysis: StochasticAnalysis | null;
  chartData: StochasticChartDataPoint[];
  showReferenceLines: boolean;
}

export default function ResultsChart({ fireAnalysis, chartData, showReferenceLines }: StochasticResultsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const currentAge = useCurrentAge();

  useEffect(() => {
    const handleInteractionStart = (event: MouseEvent | TouchEvent) => {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setClickedOutsideChart(true);
      } else {
        setClickedOutsideChart(false);
      }
    };

    document.addEventListener('mousedown', handleInteractionStart);
    document.addEventListener('touchstart', handleInteractionStart);

    return () => {
      document.removeEventListener('mousedown', handleInteractionStart);
      document.removeEventListener('touchstart', handleInteractionStart);
    };
  }, []);

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  const interval = isSmallScreen ? 4 : 3;

  return (
    <div ref={chartRef} className="h-64 w-full sm:h-80 lg:h-96 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
          <defs>
            <linearGradient id="colorP75" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="colorP25" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 1, '$')}
          />
          <Area type="monotone" dataKey="p75" stroke="var(--chart-3)" fill="url(#colorP75)" activeDot={false} />
          <Area type="monotone" dataKey="p50" stroke="var(--chart-2)" fill="url(#colorP50)" activeDot={false} />
          <Area type="monotone" dataKey="p25" stroke="var(--chart-1)" fill="url(#colorP25)" activeDot={false} />
          <Tooltip
            content={<CustomTooltip currentAge={currentAge!} disabled={isSmallScreen && clickedOutsideChart} />}
            cursor={{ stroke: foregroundMutedColor }}
          />
          {fireAnalysis?.p50FireAge && showReferenceLines && (
            <ReferenceLine x={Math.round(fireAnalysis.p50FireAge)} stroke={foregroundColor} strokeDasharray="10 5" />
          )}
          {fireAnalysis?.requiredPortfolio && showReferenceLines && (
            <ReferenceLine y={Math.round(fireAnalysis.requiredPortfolio)} stroke={foregroundColor} strokeDasharray="10 5" />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
