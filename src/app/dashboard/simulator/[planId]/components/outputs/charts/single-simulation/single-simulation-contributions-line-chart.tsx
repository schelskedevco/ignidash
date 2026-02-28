'use client';

import { useState, useCallback, memo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import { useChartInterval } from '@/hooks/use-chart-interval';
import type { SingleSimulationContributionsChartDataPoint } from '@/lib/types/chart-data-points';
import type { ContributionsDataView } from '@/lib/types/chart-data-views';
import type { AccountDataWithFlows } from '@/lib/calc/account';
import type { KeyMetrics } from '@/lib/types/key-metrics';

import { ChartEmptyState, TimeSeriesChartContainer, TooltipContainer, TooltipEntryRow } from '../chart-primitives';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationContributionsChartDataPoint;
    payload:
      | SingleSimulationContributionsChartDataPoint
      | ({
          age: number;
          annualStockContributions: number;
          annualBondContributions: number;
          annualCashContributions: number;
        } & AccountDataWithFlows);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: ContributionsDataView;
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

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
            {formatCompactCurrency(
              payload.reduce((sum, item) => sum + item.value, 0),
              3
            )}
          </span>
        </p>
      );
      break;
    default:
      break;
  }

  const filterZeroValues = !['employerMatch', 'shortfall'].includes(dataView);

  return (
    <TooltipContainer label={label!} startAge={startAge} footer={footer}>
      <div className="flex flex-col gap-1">
        {payload
          .filter((entry) => (filterZeroValues ? entry.value !== 0 : true))
          .map((entry) => (
            <TooltipEntryRow
              key={entry.dataKey}
              dataKey={entry.dataKey}
              color={entry.color}
              formattedValue={formatCompactCurrency(entry.value, 1)}
            />
          ))}
      </div>
    </TooltipContainer>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

interface SingleSimulationContributionsLineChartProps {
  rawChartData: SingleSimulationContributionsChartDataPoint[];
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: ContributionsDataView;
  customDataID: string;
  startAge: number;
}

export default function SingleSimulationContributionsLineChart({
  rawChartData,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  customDataID,
  startAge,
}: SingleSimulationContributionsLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { gridColor, foregroundColor, backgroundColor, foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData:
    | SingleSimulationContributionsChartDataPoint[]
    | Array<
        {
          age: number;
          annualStockContributions: number;
          annualBondContributions: number;
          annualCashContributions: number;
        } & AccountDataWithFlows
      > = useChartDataSlice(rawChartData, 'single');

  const lineDataKeys: (keyof SingleSimulationContributionsChartDataPoint)[] = [];
  const strokeColors: string[] = [];

  const barDataKeys: (keyof SingleSimulationContributionsChartDataPoint)[] = [];
  const barColors: string[] = [];

  const formatter = (value: number) => formatCompactCurrency(value, 1);
  let stackId: string | undefined = undefined;

  switch (dataView) {
    case 'annualAmounts':
      stackId = 'stack';

      barDataKeys.push('annualStockContributions', 'annualBondContributions', 'annualCashContributions');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
    case 'cumulativeAmounts':
      stackId = 'stack';

      barDataKeys.push('cumulativeStockContributions', 'cumulativeBondContributions', 'cumulativeCashContributions');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
    case 'taxCategory':
      stackId = 'stack';

      barDataKeys.push('taxableContributions', 'taxDeferredContributions', 'taxFreeContributions', 'cashSavingsContributions');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'employerMatch':
      barDataKeys.push('annualEmployerMatch', 'cumulativeEmployerMatch');
      barColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'shortfall':
      barDataKeys.push('annualShortfallRepaid', 'outstandingShortfall');
      barColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      stackId = 'stack';

      chartData = chartData.flatMap(({ age, perAccountData }) =>
        perAccountData
          .filter((account) => account.id === customDataID)
          .map((account) => ({
            age,
            ...account,
            annualStockContributions: account.contributions.stocks,
            annualBondContributions: account.contributions.bonds,
            annualCashContributions: account.contributions.cash,
          }))
      );

      barDataKeys.push('annualStockContributions', 'annualBondContributions', 'annualCashContributions');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
  }

  const interval = useChartInterval(chartData.length);

  const onClick = useCallback(
    (data: { activeLabel: string | number | undefined }) => {
      if (data.activeLabel !== undefined && onAgeSelect) {
        onAgeSelect(Number(data.activeLabel));
      }
    },
    [onAgeSelect]
  );

  const allDataKeys = [...lineDataKeys, ...barDataKeys];
  const hasNoData =
    chartData.length === 0 || chartData.every((point) => allDataKeys.every((key) => point[key as keyof typeof point] === 0));
  if (hasNoData) {
    return <ChartEmptyState />;
  }

  return (
    <TimeSeriesChartContainer ref={chartRef}>
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
            strokeOpacity={1}
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
    </TimeSeriesChartContainer>
  );
}
