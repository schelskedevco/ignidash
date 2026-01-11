'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback, memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

import type { KeyMetrics } from '@/lib/types/key-metrics';
import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import type { AccountDataWithTransactions } from '@/lib/calc/account';
import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationPortfolioChartDataPoint;
    payload:
      | SingleSimulationPortfolioChartDataPoint
      | ({ age: number; stockHoldings: number; bondHoldings: number; cashHoldings: number } & AccountDataWithTransactions);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - Math.floor(startAge));

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)', 'var(--chart-6)', 'var(--chart-7)', 'var(--foreground)'];

  const total = payload.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Age {label}</span>
        <span className="text-muted-foreground ml-1">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-1">
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
});

CustomTooltip.displayName = 'CustomTooltip';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface SingleSimulationPortfolioAreaChartProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  startAge: number;
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  dataView: 'assetClass' | 'taxCategory' | 'custom';
  customDataID: string;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function SingleSimulationPortfolioAreaChart({
  rawChartData,
  startAge,
  keyMetrics,
  showReferenceLines,
  dataView,
  customDataID,
  onAgeSelect,
  selectedAge,
}: SingleSimulationPortfolioAreaChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData:
    | SingleSimulationPortfolioChartDataPoint[]
    | Array<{ age: number; stockHoldings: number; bondHoldings: number; cashHoldings: number } & AccountDataWithTransactions> =
    useChartDataSlice(rawChartData, 'single');

  const dataKeys: (keyof SingleSimulationPortfolioChartDataPoint | keyof AccountDataWithTransactions)[] = [];
  const formatter = (value: number) => formatNumber(value, 1, '$');
  switch (dataView) {
    case 'assetClass':
      dataKeys.push('stockHoldings', 'bondHoldings', 'cashHoldings');
      break;
    case 'taxCategory':
      dataKeys.push('taxableValue', 'taxDeferredValue', 'taxFreeValue', 'cashSavings');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      const perAccountData = chartData.flatMap(({ age, perAccountData }) =>
        perAccountData
          .filter((account) => account.id === customDataID)
          .map((account) => {
            const balance = account.balance;

            const assetAllocation = account.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
            const stocksAllocation = assetAllocation.stocks;
            const bondsAllocation = assetAllocation.bonds;
            const cashAllocation = assetAllocation.cash;

            return {
              age,
              ...account,
              stockHoldings: balance * stocksAllocation,
              bondHoldings: balance * bondsAllocation,
              cashHoldings: balance * cashAllocation,
            };
          })
      );

      chartData = perAccountData;
      dataKeys.push('stockHoldings', 'bondHoldings', 'cashHoldings');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

  const calculateInterval = useCallback((dataLength: number, desiredTicks = 12) => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks) - 1;
  }, []);
  const interval = calculateInterval(chartData.length);

  const onClick = useCallback(
    (data: { activeLabel: string | number | undefined }) => {
      if (data.activeLabel !== undefined && onAgeSelect) {
        onAgeSelect(Number(data.activeLabel));
      }
    },
    [onAgeSelect]
  );

  return (
    <div ref={chartRef} className="h-72 w-full sm:h-84 lg:h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
      <AreaChart
        responsive
        width="100%"
        height="100%"
        data={chartData}
        className="text-xs"
        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
        onClick={onClick}
      >
        <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
        <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
        <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
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
        {keyMetrics.retirementAge && showReferenceLines && (
          <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
        )}
        {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1.5} ifOverflow="visible" />}
        {keyMetrics.portfolioAtRetirement && showReferenceLines && dataView !== 'custom' && (
          <ReferenceLine y={Math.round(keyMetrics.portfolioAtRetirement)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
        )}
      </AreaChart>
    </div>
  );
}
