'use client';

import { useState, useCallback, memo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ChartLineIcon } from 'lucide-react';

import { formatNumber, formatChartString, cn } from '@/lib/utils';
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
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

import { NEEDS_BG_TEXT_COLORS } from '../chart-primitives';

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

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - Math.floor(startAge));

  const formatValue = (value: number, mode: ReturnsDataView) => {
    switch (mode) {
      case 'rates':
      case 'cagr':
        return `${(value * 100).toFixed(1)}%`;
      case 'annualAmounts':
      case 'cumulativeAmounts':
      case 'taxCategory':
      case 'appreciation':
      case 'custom':
        return formatNumber(value, 1, '$');
      default:
        return value;
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
          <span className="ml-1 font-semibold">{formatNumber(lineEntry.value, 3, '$')}</span>
        </p>
      );
      break;
    }
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Age {label}</span>
        <span className="text-muted-foreground ml-1">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-1">
        {transformedPayload.map((entry) => (
          <p
            key={entry.dataKey}
            style={{ backgroundColor: entry.color }}
            className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
              'text-background': NEEDS_BG_TEXT_COLORS.includes(entry.color),
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

  const { gridColor, foregroundColor, backgroundColor, foregroundMutedColor } = useChartTheme();
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
  let stackId: string | undefined = 'stack';
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
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('totalAnnualGains');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push('annualStockGain', 'annualBondGain', 'annualCashGain');
      barColors.push('var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'cumulativeAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('totalCumulativeGains');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push('cumulativeStockGain', 'cumulativeBondGain', 'cumulativeCashGain');
      barColors.push('var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'taxCategory':
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('totalAnnualGains');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push('taxableGains', 'taxDeferredGains', 'taxFreeGains', 'cashSavingsGains');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'appreciation':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('annualAssetAppreciation', 'cumulativeAssetAppreciation');
      barColors.push('var(--chart-2)', 'var(--chart-4)');

      stackId = undefined;
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      formatter = (value: number) => formatNumber(value, 1, '$');

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
        stackOffset="sign"
        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
        onClick={onClick}
      >
        <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
        <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
        <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
        {showReferenceLineAtZero && <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />}
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
        {keyMetrics.retirementAge && showReferenceLines && (
          <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
        )}
        {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1.5} ifOverflow="visible" />}
      </ComposedChart>
    </div>
  );
}
