'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';
import type { AccountDataWithReturns } from '@/lib/calc/returns';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationReturnsChartDataPoint;
    payload:
      | SingleSimulationReturnsChartDataPoint
      | ({ age: number; annualStockGrowth: number; annualBondGrowth: number; annualCashGrowth: number } & AccountDataWithReturns);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: 'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'custom';
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - Math.floor(startAge));

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)', 'var(--chart-6)', 'var(--chart-7)', 'var(--foreground)'];

  const formatValue = (value: number, mode: 'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'custom') => {
    switch (mode) {
      case 'rates':
        return `${(value * 100).toFixed(1)}%`;
      case 'annualAmounts':
      case 'cumulativeAmounts':
      case 'custom':
        return formatNumber(value, 1, '$');
      default:
        return value;
    }
  };

  let footer = null;
  switch (dataView) {
    case 'rates':
      break;
    case 'annualAmounts':
    case 'cumulativeAmounts':
    case 'custom':
      footer = (
        <p className="mx-1 mt-2 flex justify-between text-xs font-semibold">
          <span className="mr-2">Total:</span>
          <span className="ml-1 font-semibold">
            {formatNumber(
              payload.reduce((sum, item) => sum + item.value, 0),
              3,
              '$'
            )}
          </span>
        </p>
      );
      break;
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-xs font-semibold">
        <span className="mr-2">Age {label}</span>
        <span className="text-muted-foreground ml-1">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <p
            key={entry.dataKey}
            style={{ backgroundColor: entry.color }}
            className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-xs', {
              'text-background': needsBgTextColor.includes(entry.color),
            })}
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">{formatValue(entry.value, dataView)}</span>
          </p>
        ))}
      </div>
      {footer}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

interface SingleSimulationReturnsLineChartProps {
  rawChartData: SingleSimulationReturnsChartDataPoint[];
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: 'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'custom';
  customDataID: string;
  startAge: number;
}

export default function SingleSimulationReturnsLineChart({
  rawChartData,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  customDataID,
  startAge,
}: SingleSimulationReturnsLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData:
    | SingleSimulationReturnsChartDataPoint[]
    | Array<{ age: number; annualStockGrowth: number; annualBondGrowth: number; annualCashGrowth: number } & AccountDataWithReturns> =
    useChartDataSlice(rawChartData);

  const lineDataKeys: (keyof SingleSimulationReturnsChartDataPoint)[] = [];
  const strokeColors: string[] = ['var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--foreground)'];

  let formatter = undefined;
  switch (dataView) {
    case 'rates':
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('realStockReturn', 'realBondReturn', 'realCashReturn', 'inflationRate');
      break;
    case 'annualAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('annualStockGrowth', 'annualBondGrowth', 'annualCashGrowth');
      break;
    case 'cumulativeAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('cumulativeStockGrowth', 'cumulativeBondGrowth', 'cumulativeCashGrowth');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      formatter = (value: number) => formatNumber(value, 1, '$');

      chartData = chartData.flatMap(({ age, perAccountData }) =>
        perAccountData
          .filter((account) => account.id === customDataID)
          .map((account) => {
            return {
              age,
              ...account,
              annualStockGrowth: account.returnAmountsForPeriod.stocks,
              annualBondGrowth: account.returnAmountsForPeriod.bonds,
              annualCashGrowth: account.returnAmountsForPeriod.cash,
            };
          })
      );

      lineDataKeys.push('annualStockGrowth', 'annualBondGrowth', 'annualCashGrowth');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#18181b'; // zinc-100 : zinc-900
  const backgroundColor = resolvedTheme === 'dark' ? '#27272a' : '#ffffff'; // zinc-800 : white
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600

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

  const { getOpacity } = useLineChartLegendEffectOpacity();

  return (
    <div>
      <div ref={chartRef} className="h-72 w-full sm:h-84 lg:h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
        <LineChart
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
          {lineDataKeys.map((dataKey, i) => (
            <Line
              key={`line-${dataKey}-${i}`}
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColors[i]}
              activeDot={{ stroke: backgroundColor, strokeWidth: 2 }}
              dot={{ fill: backgroundColor, strokeWidth: 2 }}
              strokeWidth={2}
              strokeOpacity={getOpacity(dataKey)}
            />
          ))}
          <Tooltip
            content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} dataView={dataView} />}
            cursor={{ stroke: foregroundColor }}
          />
          {keyMetrics.retirementAge && showReferenceLines && (
            <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
          )}
          {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1.5} ifOverflow="visible" />}
        </LineChart>
      </div>
    </div>
  );
}
