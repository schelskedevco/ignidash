'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';
import type { AccountDataWithTransactions } from '@/lib/calc/v2/account';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { uniformLifetimeMap } from '@/lib/calc/data/rmds-table';
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

import TimeSeriesLegend from '../time-series-legend';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationWithdrawalsChartDataPoint;
    payload:
      | SingleSimulationWithdrawalsChartDataPoint
      | ({ age: number; annualWithdrawals: number; cumulativeWithdrawals: number } & AccountDataWithTransactions);
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
    | 'earlyWithdrawalPenalties'
    | 'earlyWithdrawals'
    | 'withdrawalRate'
    | 'custom';
}

const CustomTooltip = ({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

  const formatValue = (
    value: number,
    mode:
      | 'annualAmounts'
      | 'cumulativeAmounts'
      | 'taxCategory'
      | 'realizedGains'
      | 'requiredMinimumDistributions'
      | 'earlyWithdrawalPenalties'
      | 'earlyWithdrawals'
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

  let tooltipFooterComponent = null;
  if (dataView === 'taxCategory') {
    tooltipFooterComponent = (
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
  } else if (dataView === 'requiredMinimumDistributions' && label && label >= 73) {
    const lookupAge = Math.min(Math.floor(label), 120);
    const lifeExpectancyFactor = uniformLifetimeMap[lookupAge];

    tooltipFooterComponent = (
      <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Life Expectancy Factor:</span>
        <span className="ml-1 font-semibold">{lifeExpectancyFactor}</span>
      </p>
    );
  }

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
            <span className="ml-1 font-semibold">{formatValue(entry.value, dataView)}</span>
          </p>
        ))}
      </div>
      {tooltipFooterComponent}
    </div>
  );
};

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

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
    | 'earlyWithdrawalPenalties'
    | 'earlyWithdrawals'
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
    | Array<{ age: number; annualWithdrawals: number; cumulativeWithdrawals: number } & AccountDataWithTransactions> = rawChartData;

  const dataKeys: (keyof SingleSimulationWithdrawalsChartDataPoint)[] = [];
  const yAxisDomain: [number, number] | undefined = undefined;
  let formatter = undefined;
  switch (dataView) {
    case 'annualAmounts':
      dataKeys.push('annualWithdrawals');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'cumulativeAmounts':
      dataKeys.push('cumulativeWithdrawals');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'taxCategory':
      dataKeys.push('taxableWithdrawals', 'taxDeferredWithdrawals', 'taxFreeWithdrawals', 'cashWithdrawals');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'realizedGains':
      dataKeys.push('annualRealizedGains', 'cumulativeRealizedGains');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'requiredMinimumDistributions':
      dataKeys.push('annualRequiredMinimumDistributions', 'cumulativeRequiredMinimumDistributions');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'earlyWithdrawalPenalties':
      dataKeys.push('annualEarlyWithdrawalPenalties', 'cumulativeEarlyWithdrawalPenalties');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'earlyWithdrawals':
      dataKeys.push('annualEarlyWithdrawals', 'cumulativeEarlyWithdrawals');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'withdrawalRate':
      dataKeys.push('withdrawalRate');
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
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
            return { age, ...account, annualWithdrawals: account.withdrawalsForPeriod, cumulativeWithdrawals: account.totalWithdrawals };
          })
      );

      chartData = perAccountData;
      dataKeys.push('annualWithdrawals', 'cumulativeWithdrawals');
      formatter = (value: number) => formatNumber(value, 1, '$');
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

  const { getOpacity, handleMouseEnter, handleMouseLeave } = useLineChartLegendEffectOpacity();

  return (
    <div>
      <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            className="text-xs"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            tabIndex={-1}
            onClick={onClick}
          >
            <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              tickLine={false}
              hide={isSmallScreen}
              tickFormatter={formatter}
              domain={yAxisDomain}
            />
            {dataKeys.map((dataKey, index) => (
              <Line
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={COLORS[index % COLORS.length]}
                dot={false}
                activeDot={false}
                strokeWidth={3}
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
            {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <TimeSeriesLegend
        colors={COLORS}
        legendStrokeColor={legendStrokeColor}
        dataKeys={dataKeys}
        isSmallScreen={isSmallScreen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
