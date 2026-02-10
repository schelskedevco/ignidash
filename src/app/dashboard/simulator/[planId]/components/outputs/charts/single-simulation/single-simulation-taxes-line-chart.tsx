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
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';
import type { TaxesDataView } from '@/lib/types/chart-data-views';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { Divider } from '@/components/catalyst/divider';
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

import { NEEDS_BG_TEXT_COLORS } from '../chart-primitives';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationTaxesChartDataPoint;
    payload: SingleSimulationTaxesChartDataPoint;
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: TaxesDataView;
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - Math.floor(startAge));

  const formatValue = (
    value: number,
    mode:
      | 'marginalRates'
      | 'effectiveRates'
      | 'annualAmounts'
      | 'cumulativeAmounts'
      | 'taxableIncome'
      | 'adjustedGrossIncome'
      | 'investmentIncome'
      | 'retirementDistributions'
      | 'taxFreeIncome'
      | 'ordinaryIncome'
      | 'capGainsAndDividends'
      | 'earlyWithdrawalPenalties'
      | 'adjustmentsAndDeductions'
      | 'socialSecurityIncome'
      | 'socialSecurityTaxablePercentage'
  ) => {
    switch (mode) {
      case 'marginalRates':
      case 'effectiveRates':
      case 'socialSecurityTaxablePercentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'annualAmounts':
      case 'cumulativeAmounts':
      case 'taxableIncome':
      case 'adjustedGrossIncome':
      case 'investmentIncome':
      case 'retirementDistributions':
      case 'taxFreeIncome':
      case 'ordinaryIncome':
      case 'capGainsAndDividends':
      case 'earlyWithdrawalPenalties':
      case 'adjustmentsAndDeductions':
      case 'socialSecurityIncome':
        return formatNumber(value, 1, '$');
      default:
        return value;
    }
  };

  const transformedPayload = payload.filter((entry) => entry.color !== LINE_COLOR);

  let filterZeroValues = true;

  let header = null;
  let footer = null;

  switch (dataView) {
    case 'marginalRates':
    case 'effectiveRates':
    case 'socialSecurityTaxablePercentage':
      filterZeroValues = false;
      break;
    case 'annualAmounts':
    case 'cumulativeAmounts':
    case 'investmentIncome':
    case 'retirementDistributions':
    case 'taxFreeIncome':
    case 'ordinaryIncome':
    case 'capGainsAndDividends':
    case 'adjustmentsAndDeductions':
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
    case 'taxableIncome':
    case 'adjustedGrossIncome':
      const entry = payload[0].payload;

      const lineEntry = payload.find((entry) => entry.color === LINE_COLOR);
      if (!lineEntry) {
        console.error('Line entry data not found');
        break;
      }

      header = (
        <div className="mb-2 flex flex-col gap-2">
          <p className="mx-1 flex justify-between text-sm font-semibold">
            <span className="mr-2">Gross Income:</span>
            <span className="ml-1 font-semibold">{formatValue(entry.grossIncome, dataView)}</span>
          </p>
          <Divider soft />
        </div>
      );

      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="flex items-center gap-1">
            <ChartLineIcon className="h-3 w-3" />
            <span className="mr-2">{`${formatChartString(lineEntry.dataKey)}:`}</span>
          </span>
          <span className="ml-1 font-semibold">{formatValue(lineEntry.value, dataView)}</span>
        </p>
      );
      break;
    case 'earlyWithdrawalPenalties':
      filterZeroValues = false;
      break;
    case 'socialSecurityIncome':
      filterZeroValues = false;
      break;
  }

  const positiveEntries = transformedPayload.filter((entry) => (filterZeroValues ? entry.value > 0 : entry.value >= 0));
  const negativeEntries = transformedPayload.filter((entry) => entry.value < 0);

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Age {label}</span>
        <span className="text-muted-foreground ml-1">{yearForAge}</span>
      </p>
      {header}
      <div className="flex flex-col gap-2">
        {positiveEntries.length > 0 && (
          <div className="flex flex-col gap-1">
            {positiveEntries.map((entry) => (
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
        )}
        {positiveEntries.length > 0 && negativeEntries.length > 0 && <Divider soft />}
        {negativeEntries.length > 0 && (
          <div className="flex flex-col gap-1">
            {negativeEntries.map((entry) => (
              <p
                key={entry.dataKey}
                style={{ backgroundColor: entry.color }}
                className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
                  'text-background': NEEDS_BG_TEXT_COLORS.includes(entry.color),
                })}
              >
                <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
                <span className="ml-1 font-semibold">{formatValue(Math.abs(entry.value), dataView)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const LINE_COLOR = 'var(--foreground)';

interface SingleSimulationTaxesLineChartProps {
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: TaxesDataView;
  startAge: number;
}

export default function SingleSimulationTaxesLineChart({
  rawChartData,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  startAge,
}: SingleSimulationTaxesLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { gridColor, foregroundColor, backgroundColor, foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData: SingleSimulationTaxesChartDataPoint[] = useChartDataSlice(rawChartData, 'single');

  const lineDataKeys: (keyof SingleSimulationTaxesChartDataPoint)[] = [];
  const strokeColors: string[] = [];

  const barDataKeys: (keyof SingleSimulationTaxesChartDataPoint)[] = [];
  const barColors: string[] = [];

  let formatter = undefined;
  let stackId: string | undefined = 'stack';
  let stackOffset: 'sign' | undefined = undefined;

  switch (dataView) {
    case 'marginalRates':
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('topMarginalIncomeTaxRate', 'topMarginalCapGainsTaxRate');
      strokeColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'effectiveRates':
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('effectiveIncomeTaxRate', 'effectiveCapGainsTaxRate');
      strokeColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'annualAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('annualIncomeTax', 'annualFicaTax', 'annualCapGainsTax', 'annualNiit', 'annualEarlyWithdrawalPenalties');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)');
      break;
    case 'cumulativeAmounts':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push(
        'cumulativeIncomeTax',
        'cumulativeFicaTax',
        'cumulativeCapGainsTax',
        'cumulativeNiit',
        'cumulativeEarlyWithdrawalPenalties'
      );
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)');
      break;
    case 'taxableIncome':
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('taxableIncome');
      strokeColors.push('var(--foreground)');

      barDataKeys.push(
        'incomeTaxedAsOrdinary',
        'incomeTaxedAsLtcg',
        'taxDeductibleContributions',
        'standardDeduction',
        'capitalLossDeduction'
      );
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)');

      chartData = chartData.map((entry) => ({
        ...entry,
        taxDeductibleContributions: -entry.taxDeductibleContributions,
        standardDeduction: -entry.standardDeduction,
        capitalLossDeduction: -entry.capitalLossDeduction,
      }));

      stackOffset = 'sign';
      break;
    case 'adjustedGrossIncome':
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('adjustedGrossIncome');
      strokeColors.push('var(--foreground)');

      barDataKeys.push('incomeTaxedAsOrdinary', 'incomeTaxedAsLtcg', 'taxDeductibleContributions', 'capitalLossDeduction');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)');

      chartData = chartData.map((entry) => ({
        ...entry,
        taxDeductibleContributions: -entry.taxDeductibleContributions,
        capitalLossDeduction: -entry.capitalLossDeduction,
      }));

      stackOffset = 'sign';
      break;
    case 'investmentIncome':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('taxableInterestIncome', 'taxableDividendIncome', 'realizedGains');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
    case 'retirementDistributions':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('taxDeferredWithdrawals', 'earlyRothEarningsWithdrawals');
      barColors.push('var(--chart-1)', 'var(--chart-2)');
      break;
    case 'taxFreeIncome':
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('taxFreeIncome');
      strokeColors.push('var(--chart-2)');
      break;
    case 'ordinaryIncome':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('earnedIncome', 'taxableSocialSecurityIncome', 'taxableInterestIncome', 'taxableRetirementDistributions');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    case 'capGainsAndDividends':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('realizedGains', 'taxableDividendIncome');
      barColors.push('var(--chart-1)', 'var(--chart-2)');
      break;
    case 'earlyWithdrawalPenalties':
      formatter = (value: number) => formatNumber(value, 1, '$');
      stackId = undefined;

      barDataKeys.push('annualEarlyWithdrawalPenalties', 'cumulativeEarlyWithdrawalPenalties');
      barColors.push('var(--chart-2)', 'var(--chart-4)');
      break;
    case 'adjustmentsAndDeductions':
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('taxDeductibleContributions', 'capitalLossDeduction', 'standardDeduction');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      break;
    case 'socialSecurityIncome':
      formatter = (value: number) => formatNumber(value, 1, '$');
      stackId = undefined;

      barDataKeys.push('socialSecurityIncome', 'taxableSocialSecurityIncome');
      barColors.push('var(--chart-1)', 'var(--chart-2)');
      break;
    case 'socialSecurityTaxablePercentage':
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('maxTaxablePercentage', 'actualTaxablePercentage');
      strokeColors.push('var(--chart-2)', 'var(--chart-4)');
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
        stackOffset={stackOffset}
        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
        onClick={onClick}
      >
        <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
        <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
        <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
        {(dataView === 'taxableIncome' || dataView === 'adjustedGrossIncome') && (
          <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />
        )}
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
