'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import type { KeyMetrics } from '@/lib/types/key-metrics';
import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import type { AccountDataWithTransactions } from '@/lib/calc/v2/portfolio';
import { formatNumber, formatChartString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationPortfolioChartDataPoint;
    payload:
      | SingleSimulationPortfolioChartDataPoint
      | ({ age: number; stocks: number; bonds: number; cash: number } & AccountDataWithTransactions);
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
            className={`border-foreground/50 flex justify-between rounded-lg border px-2 text-sm ${needsBgTextColor.includes(entry.color) ? 'text-background' : 'text-foreground'}`}
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">{formatNumber(entry.value, 1, '$')}</span>
          </p>
        ))}
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

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface SingleSimulationPortfolioAreaChartProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  startAge: number;
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  dataView: 'assetClass' | 'taxTreatment' | 'custom';
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
    | Array<{ age: number; stocks: number; bonds: number; cash: number } & AccountDataWithTransactions> = rawChartData;

  const dataKeys: (keyof SingleSimulationPortfolioChartDataPoint | keyof AccountDataWithTransactions)[] = [];
  switch (dataView) {
    case 'assetClass':
      dataKeys.push('stocks', 'bonds', 'cash');
      break;
    case 'taxTreatment':
      dataKeys.push('taxableBrokerage', 'taxDeferred', 'taxFree', 'cashSavings');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      const perAccountData = chartData.flatMap(({ age, perAccountData }) =>
        Object.values(perAccountData)
          .filter((account) => account.id === customDataID)
          .map((account) => {
            const totalValue = account.totalValue;

            const assetAllocation = account.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
            const stocksAllocation = assetAllocation.stocks;
            const bondsAllocation = assetAllocation.bonds;
            const cashAllocation = assetAllocation.cash;

            return {
              age,
              ...account,
              stocks: totalValue * stocksAllocation,
              bonds: totalValue * bondsAllocation,
              cash: totalValue * cashAllocation,
            };
          })
      );

      chartData = perAccountData;
      dataKeys.push('stocks', 'bonds', 'cash');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600
  const legendStrokeColor = resolvedTheme === 'dark' ? 'white' : 'black';

  const calculateInterval = useCallback((dataLength: number, desiredTicks = 8) => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks);
  }, []);
  const interval = calculateInterval(chartData.length);

  const onClick = useCallback(
    (data: { activeLabel: string | undefined }) => {
      if (data.activeLabel !== undefined && onAgeSelect) {
        onAgeSelect(Number(data.activeLabel));
      }
    },
    [onAgeSelect]
  );

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
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              hide={isSmallScreen}
              tickFormatter={(value: number) => formatNumber(value, 1, '$')}
            />
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
            {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
            {keyMetrics.portfolioAtRetirement && showReferenceLines && dataView !== 'custom' && (
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
        {dataKeys.map((dataKey, index) => (
          <div key={dataKey} className="flex items-center gap-x-2 text-sm font-medium">
            <svg viewBox="0 0 6 6" aria-hidden="true" style={{ fill: COLORS[index % COLORS.length] }} className="size-5 shrink-0">
              <rect x={0.5} y={0.5} width={5} height={5} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
            </svg>
            {formatChartString(dataKey)}
          </div>
        ))}
      </div>
    </div>
  );
}
