'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback, memo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';
import type { AccountDataWithTransactions } from '@/lib/calc/account';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { uniformLifetimeMap } from '@/lib/calc/historical-data/rmds-table';
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationWithdrawalsChartDataPoint;
    payload:
      | SingleSimulationWithdrawalsChartDataPoint
      | ({
          age: number;
          annualStockWithdrawals: number;
          annualBondWithdrawals: number;
          annualCashWithdrawals: number;
        } & AccountDataWithTransactions);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView:
    | 'annualAmounts'
    | 'cumulativeAmounts'
    | 'taxCategory'
    | 'realizedGains'
    | 'requiredMinimumDistributions'
    | 'earlyWithdrawals'
    | 'shortfall'
    | 'withdrawalRate'
    | 'custom';
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - Math.floor(startAge));

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)', 'var(--foreground)'];

  const formatValue = (
    value: number,
    mode:
      | 'annualAmounts'
      | 'cumulativeAmounts'
      | 'taxCategory'
      | 'realizedGains'
      | 'requiredMinimumDistributions'
      | 'earlyWithdrawals'
      | 'shortfall'
      | 'withdrawalRate'
      | 'custom'
  ) => {
    switch (mode) {
      case 'withdrawalRate':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return formatNumber(value, 1, '$');
    }
  };

  let footer = null;
  switch (dataView) {
    case 'annualAmounts':
    case 'cumulativeAmounts':
    case 'taxCategory':
    case 'custom':
      footer = (
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
      );
      break;
    case 'requiredMinimumDistributions':
      const rmdAge = (payload[0].payload as SingleSimulationWithdrawalsChartDataPoint).rmdAge;
      if (label && label >= rmdAge) {
        const lookupAge = Math.min(Math.floor(label), 120);
        const lifeExpectancyFactor = uniformLifetimeMap[lookupAge];

        footer = (
          <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
            <span className="mr-2">Life Expectancy Factor:</span>
            <span className="ml-1 font-semibold">{lifeExpectancyFactor}</span>
          </p>
        );
      }
      break;
    default:
      break;
  }

  const filterZeroValues = !['realizedGains', 'requiredMinimumDistributions', 'earlyWithdrawals', 'shortfall', 'withdrawalRate'].includes(
    dataView
  );

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Age {label}</span>
        <span className="text-muted-foreground ml-1">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-1">
        {payload
          .filter((entry) => (filterZeroValues ? entry.value !== 0 : true))
          .map((entry) => (
            <p
              key={entry.dataKey}
              style={{ backgroundColor: entry.color }}
              className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
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

interface SingleSimulationWithdrawalsLineChartProps {
  rawChartData: SingleSimulationWithdrawalsChartDataPoint[];
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView:
    | 'annualAmounts'
    | 'cumulativeAmounts'
    | 'taxCategory'
    | 'realizedGains'
    | 'requiredMinimumDistributions'
    | 'earlyWithdrawals'
    | 'shortfall'
    | 'withdrawalRate'
    | 'custom';
  customDataID: string;
  startAge: number;
}

export default function SingleSimulationWithdrawalsLineChart({
  rawChartData,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  customDataID,
  startAge,
}: SingleSimulationWithdrawalsLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData:
    | SingleSimulationWithdrawalsChartDataPoint[]
    | Array<
        {
          age: number;
          annualStockWithdrawals: number;
          annualBondWithdrawals: number;
          annualCashWithdrawals: number;
        } & AccountDataWithTransactions
      > = useChartDataSlice(rawChartData, 'single');

  const lineDataKeys: (keyof SingleSimulationWithdrawalsChartDataPoint)[] = [];
  const strokeColors: string[] = [];

  const barDataKeys: (keyof SingleSimulationWithdrawalsChartDataPoint)[] = [];
  const barColors: string[] = [];

  let formatter = undefined;
  let stackId: string | undefined = undefined;

  switch (dataView) {
    case 'annualAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');
      stackId = 'stack';

      barDataKeys.push('annualStockWithdrawals', 'annualBondWithdrawals', 'annualCashWithdrawals');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
    case 'cumulativeAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');
      stackId = 'stack';

      barDataKeys.push('cumulativeStockWithdrawals', 'cumulativeBondWithdrawals', 'cumulativeCashWithdrawals');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
    case 'taxCategory':
      formatter = (value: number) => formatNumber(value, 1, '$');
      stackId = 'stack';

      barDataKeys.push('taxableWithdrawals', 'taxDeferredWithdrawals', 'taxFreeWithdrawals', 'cashSavingsWithdrawals');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'realizedGains':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('annualRealizedGains', 'cumulativeRealizedGains');
      barColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'requiredMinimumDistributions':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('annualRequiredMinimumDistributions', 'cumulativeRequiredMinimumDistributions');
      barColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'earlyWithdrawals':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('annualEarlyWithdrawals', 'cumulativeEarlyWithdrawals');
      barColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'shortfall':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('annualShortfall', 'outstandingShortfall');
      barColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'withdrawalRate':
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('withdrawalRate');
      strokeColors.push('var(--chart-2)');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      formatter = (value: number) => formatNumber(value, 1, '$');
      stackId = 'stack';

      chartData = chartData.flatMap(({ age, perAccountData }) =>
        perAccountData
          .filter((account) => account.id === customDataID)
          .map((account) => ({
            age,
            ...account,
            annualStockWithdrawals: account.withdrawalsForPeriod.stocks,
            annualBondWithdrawals: account.withdrawalsForPeriod.bonds,
            annualCashWithdrawals: account.withdrawalsForPeriod.cash,
          }))
      );

      barDataKeys.push('annualStockWithdrawals', 'annualBondWithdrawals', 'annualCashWithdrawals');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const backgroundColor = resolvedTheme === 'dark' ? '#292524' : '#ffffff'; // stone-800 : white
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

  const { getOpacity } = useLineChartLegendEffectOpacity();

  const allDataKeys = [...lineDataKeys, ...barDataKeys];
  const hasNoData =
    chartData.length === 0 || chartData.every((point) => allDataKeys.every((key) => point[key as keyof typeof point] === 0));
  if (hasNoData) {
    return <div className="flex h-72 w-full items-center justify-center sm:h-84 lg:h-96">No data available for the selected view.</div>;
  }

  return (
    <div ref={chartRef} className="h-72 w-full sm:h-84 lg:h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
      <ComposedChart
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
        {barDataKeys.map((dataKey, i) => (
          <Bar key={`bar-${dataKey}-${i}`} dataKey={dataKey} maxBarSize={20} stackId={stackId} fill={barColors[i]} />
        ))}
        <Tooltip
          content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} dataView={dataView} />}
          cursor={{ stroke: foregroundColor }}
        />
        {keyMetrics.retirementAge && showReferenceLines && (
          <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
        )}
        {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1.5} ifOverflow="visible" />}
      </ComposedChart>
    </div>
  );
}
