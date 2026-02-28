'use client';

import { useState, useCallback, memo } from 'react';
import { ComposedChart, Tooltip } from 'recharts';
import { ChartLineIcon } from 'lucide-react';

import { formatChartString } from '@/lib/utils';
import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import { useChartInterval } from '@/hooks/use-chart-interval';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';
import type { ReturnsDataView } from '@/lib/types/chart-data-views';
import type { AccountDataWithReturns } from '@/lib/calc/returns';
import type { PhysicalAssetData } from '@/lib/calc/physical-assets';
import type { KeyMetrics } from '@/lib/types/key-metrics';

import {
  ChartEmptyState,
  TimeSeriesChartContainer,
  TooltipContainer,
  TooltipEntryRow,
  ChartGrid,
  TimeSeriesXAxis,
  TimeSeriesYAxis,
  LineSeries,
  BarSeries,
  SignReferenceLine,
  AgeReferenceLines,
} from '../chart-primitives';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationReturnsChartDataPoint | keyof PhysicalAssetData;
    payload:
      | SingleSimulationReturnsChartDataPoint
      | ({
          age: number;
          annualStockGain: number;
          annualBondGain: number;
          annualCashGain: number;
          totalAnnualGains: number;
        } & AccountDataWithReturns)
      | ({ age: number } & PhysicalAssetData);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: ReturnsDataView;
  customDataType: 'account' | 'asset' | undefined;
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled, dataView, customDataType }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const formatValue = (value: number) => {
    switch (dataView) {
      case 'rates':
      case 'cagr':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return formatCompactCurrency(value, 1);
    }
  };

  const transformedPayload = payload.filter((entry) => entry.color !== LINE_COLOR);

  let footer = null;
  switch (dataView) {
    case 'rates':
    case 'cagr':
    case 'appreciation':
      break;
    case 'annualAmounts':
    case 'cumulativeAmounts':
    case 'taxCategory':
    case 'custom': {
      if (customDataType === 'asset') break;

      const lineEntry = payload.find((entry) => entry.color === LINE_COLOR);
      if (!lineEntry) {
        console.error('Line entry data not found');
        break;
      }

      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="flex items-center gap-1">
            <ChartLineIcon className="h-3 w-3" />
            <span className="mr-2">{formatChartString(lineEntry.name)}:</span>
          </span>
          <span className="ml-1 font-semibold">{formatCompactCurrency(lineEntry.value, 3)}</span>
        </p>
      );
      break;
    }
  }

  return (
    <TooltipContainer label={label!} startAge={startAge} footer={footer}>
      <div className="flex flex-col gap-1">
        {transformedPayload.map((entry) => (
          <TooltipEntryRow key={entry.dataKey} dataKey={entry.dataKey} color={entry.color} formattedValue={formatValue(entry.value)} />
        ))}
      </div>
    </TooltipContainer>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const LINE_COLOR = 'var(--foreground)';

interface SingleSimulationReturnsLineChartProps {
  rawChartData: SingleSimulationReturnsChartDataPoint[];
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: ReturnsDataView;
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

  const { foregroundColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData:
    | SingleSimulationReturnsChartDataPoint[]
    | Array<
        {
          age: number;
          annualStockGain: number;
          annualBondGain: number;
          annualCashGain: number;
          totalAnnualGains: number;
        } & AccountDataWithReturns
      >
    | Array<{ age: number } & PhysicalAssetData> = useChartDataSlice(rawChartData, 'single');

  const lineDataKeys: (keyof SingleSimulationReturnsChartDataPoint | keyof PhysicalAssetData)[] = [];
  const strokeColors: string[] = [];

  const barDataKeys: (keyof SingleSimulationReturnsChartDataPoint | keyof PhysicalAssetData)[] = [];
  const barColors: string[] = [];

  let formatter = undefined;
  let stackId: string | undefined = 'barStack';
  let showReferenceLineAtZero = true;

  let customDataType: 'account' | 'asset' | undefined = undefined;

  switch (dataView) {
    case 'rates':
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('realStockReturnRate', 'realBondReturnRate', 'realCashReturnRate', 'inflationRate');
      strokeColors.push('var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-8)');

      showReferenceLineAtZero = false;
      break;
    case 'cagr':
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('realStockCagr', 'realBondCagr', 'realCashCagr');
      strokeColors.push('var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');

      showReferenceLineAtZero = false;
      break;
    case 'annualAmounts':
      formatter = (value: number) => formatCompactCurrency(value, 1);

      lineDataKeys.push('totalAnnualGains');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push('annualStockGain', 'annualBondGain', 'annualCashGain');
      barColors.push('var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'cumulativeAmounts':
      formatter = (value: number) => formatCompactCurrency(value, 1);

      lineDataKeys.push('totalCumulativeGains');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push('cumulativeStockGain', 'cumulativeBondGain', 'cumulativeCashGain');
      barColors.push('var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'taxCategory':
      formatter = (value: number) => formatCompactCurrency(value, 1);

      lineDataKeys.push('totalAnnualGains');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push('taxableGains', 'taxDeferredGains', 'taxFreeGains', 'cashSavingsGains');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'appreciation':
      formatter = (value: number) => formatCompactCurrency(value, 1);

      barDataKeys.push('annualAssetAppreciation', 'cumulativeAssetAppreciation');
      barColors.push('var(--chart-2)', 'var(--chart-4)');

      stackId = undefined;
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      formatter = (value: number) => formatCompactCurrency(value, 1);

      const perAccountData = chartData.flatMap(({ age, perAccountData }) =>
        perAccountData
          .filter((account) => account.id === customDataID)
          .map((account) => ({
            age,
            ...account,
            annualStockGain: account.returnAmounts.stocks,
            annualBondGain: account.returnAmounts.bonds,
            annualCashGain: account.returnAmounts.cash,
            totalAnnualGains: account.returnAmounts.stocks + account.returnAmounts.bonds + account.returnAmounts.cash,
          }))
      );
      if (perAccountData.length > 0) {
        customDataType = 'account';

        lineDataKeys.push('totalAnnualGains');
        strokeColors.push(LINE_COLOR);

        barDataKeys.push('annualStockGain', 'annualBondGain', 'annualCashGain');
        barColors.push('var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');

        chartData = perAccountData;
        break;
      }

      const perAssetData = chartData.flatMap(({ age, perAssetData }) =>
        perAssetData.filter((asset) => asset.id === customDataID).map((asset) => ({ age, ...asset }))
      );
      if (perAssetData.length > 0) {
        customDataType = 'asset';

        barDataKeys.push('appreciation');
        barColors.push('var(--chart-2)');

        chartData = perAssetData;
        showReferenceLineAtZero = false;
        break;
      }

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
        stackOffset="sign"
        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
        onClick={onClick}
      >
        <ChartGrid />
        <TimeSeriesXAxis interval={interval} />
        <TimeSeriesYAxis formatter={formatter} />
        {showReferenceLineAtZero && <SignReferenceLine />}
        <LineSeries dataKeys={lineDataKeys} strokeColors={strokeColors} />
        <BarSeries dataKeys={barDataKeys} barColors={barColors} stackId={stackId} />
        <Tooltip
          content={
            <CustomTooltip
              startAge={startAge}
              disabled={isSmallScreen && clickedOutsideChart}
              dataView={dataView}
              customDataType={customDataType}
            />
          }
          cursor={{ stroke: foregroundColor }}
        />
        <AgeReferenceLines keyMetrics={keyMetrics} showReferenceLines={showReferenceLines} selectedAge={selectedAge} />
      </ComposedChart>
    </TimeSeriesChartContainer>
  );
}
