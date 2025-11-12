'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import type { KeyMetrics } from '@/lib/types/key-metrics';
import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationPortfolioChartDataPoint;
    payload: SingleSimulationPortfolioChartDataPoint;
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
}

const CustomTooltip = ({ active, payload, label, startAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

  const total = payload.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-2">
        {payload.map((entry) => (
          <p
            key={entry.dataKey}
            style={{ backgroundColor: entry.color }}
            className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
              'text-background': needsBgTextColor.includes(entry.color),
            })}
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">
              {formatNumber(entry.value, 1, '$')}
              {total > 0 && ` (${formatNumber((entry.value / total) * 100, 1)}%)`}
            </span>
          </p>
        ))}
      </div>
      <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Total:</span>
        <span className="ml-1 font-semibold">{formatNumber(total, 3, '$')}</span>
      </p>
    </div>
  );
};

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface PortfolioPreviewChartProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  startAge: number;
  keyMetrics: KeyMetrics;
}

export default function PortfolioPreviewChart({ rawChartData, startAge, keyMetrics }: PortfolioPreviewChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData: SingleSimulationPortfolioChartDataPoint[] = rawChartData;
  const dataKeys: (keyof SingleSimulationPortfolioChartDataPoint)[] = ['stockHoldings', 'bondHoldings', 'cashHoldings'];
  const formatter = (value: number) => formatNumber(value, 1, '$');

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#18181b'; // zinc-100 : zinc-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600

  const calculateInterval = useCallback((dataLength: number, desiredTicks = 8) => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks);
  }, []);
  const interval = calculateInterval(chartData.length);

  return (
    <div>
      <div ref={chartRef} className="h-48 w-full sm:h-54 lg:h-60 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
            <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
            <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={true} tickFormatter={formatter} />
            {dataKeys.map((dataKey, index) => (
              <Area
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={1}
                activeDot={false}
              />
            ))}
            <Tooltip
              content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} />}
              cursor={{ stroke: foregroundColor }}
            />
            {keyMetrics.retirementAge && (
              <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
            )}
            {keyMetrics.portfolioAtRetirement && (
              <ReferenceLine y={Math.round(keyMetrics.portfolioAtRetirement)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
