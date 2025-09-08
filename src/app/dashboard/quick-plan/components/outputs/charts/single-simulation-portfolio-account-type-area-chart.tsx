'use client';

import { useTheme } from 'next-themes';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import type { FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';

interface SingleSimulationPortfolioAccountTypeAreaChartDataPoint {
  age: number;
  taxable: number;
  taxDeferred: number;
  taxFree: number;
  savings: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationPortfolioAccountTypeAreaChartDataPoint;
    payload: SingleSimulationPortfolioAccountTypeAreaChartDataPoint;
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
}

const CustomTooltip = ({ active, payload, label, startAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-2">
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-3)]/60 px-2 text-sm">
          <span className="mr-2">Taxable:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[0].value, 3, '$')}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-2)]/60 px-2 text-sm">
          <span className="mr-2">Tax Deferred:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[1].value, 3, '$')}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-1)]/60 px-2 text-sm">
          <span className="mr-2">Tax Free:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[2].value, 3, '$')}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-4)]/60 px-2 text-sm">
          <span className="mr-2">Savings:</span>
          <span className="ml-1 font-semibold">{formatNumber(payload[3].value, 3, '$')}</span>
        </p>
      </div>
      <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Total:</span>
        <span className="ml-1 font-semibold">
          {formatNumber(
            payload.reduce((sum, item) => sum + item.value, 0),
            3,
            '$'
          )}
        </span>
      </p>
    </div>
  );
};

interface SingleSimulationPortfolioAccountTypeAreaChartProps {
  rawChartData: SingleSimulationPortfolioAccountTypeAreaChartDataPoint[];
  startAge: number;
  keyMetrics: FixedReturnsKeyMetricsV2;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function SingleSimulationPortfolioAccountTypeAreaChart({
  rawChartData,
  startAge,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
}: SingleSimulationPortfolioAccountTypeAreaChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartData = rawChartData;

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  const interval = 5;

  const onClick = (data: { activeLabel: string | undefined }) => {
    if (data.activeLabel !== undefined && onAgeSelect) {
      onAgeSelect(Number(data.activeLabel));
    }
  };

  return (
    <div>
      <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            className="text-xs"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            tabIndex={-1}
            onClick={onClick}
          >
            <defs>
              <linearGradient id="colorTaxable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorTaxDeferred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorTaxFree" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              hide={isSmallScreen}
              tickFormatter={(value: number) => formatNumber(value, 1, '$')}
            />
            <Area type="monotone" dataKey="taxable" stackId="1" stroke="var(--chart-3)" fill="url(#colorTaxable)" activeDot={false} />
            <Area
              type="monotone"
              dataKey="taxDeferred"
              stackId="1"
              stroke="var(--chart-2)"
              fill="url(#colorTaxDeferred)"
              activeDot={false}
            />
            <Area type="monotone" dataKey="taxFree" stackId="1" stroke="var(--chart-1)" fill="url(#colorTaxFree)" activeDot={false} />
            <Area type="monotone" dataKey="savings" stackId="1" stroke="var(--chart-4)" fill="url(#colorSavings)" activeDot={false} />
            <Tooltip
              content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} />}
              cursor={{ stroke: foregroundColor }}
            />
            {keyMetrics.retirementAge && showReferenceLines && (
              <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
            )}
            {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
            {keyMetrics.portfolioAtRetirement && showReferenceLines && (
              <ReferenceLine y={Math.round(keyMetrics.portfolioAtRetirement)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div
        className={`mt-2 flex justify-center gap-x-2 sm:gap-x-4 ${!isSmallScreen ? 'ml-16' : ''}`}
        role="group"
        aria-label="Chart legend"
      >
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-3)]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Taxable
        </div>
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-2)]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Tax Deferred
        </div>
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-1)]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Tax Free
        </div>
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-4)]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Savings
        </div>
      </div>
    </div>
  );
}
