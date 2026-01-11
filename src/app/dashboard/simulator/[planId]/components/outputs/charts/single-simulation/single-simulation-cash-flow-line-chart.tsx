'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback, memo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ChartLineIcon } from 'lucide-react';

import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';
import type { IncomeData } from '@/lib/calc/incomes';
import type { ExpenseData } from '@/lib/calc/expenses';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationCashFlowChartDataPoint | keyof IncomeData | keyof ExpenseData;
    payload: SingleSimulationCashFlowChartDataPoint | ({ age: number } & IncomeData) | ({ age: number } & ExpenseData);
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
  dataView: 'net' | 'incomes' | 'expenses' | 'custom' | 'savingsRate';
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - Math.floor(startAge));

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)', 'var(--chart-6)', 'var(--chart-7)', 'var(--foreground)'];

  const formatValue = (value: number, mode: 'net' | 'incomes' | 'expenses' | 'custom' | 'savingsRate') => {
    switch (mode) {
      case 'savingsRate':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return formatNumber(value, 1, '$');
    }
  };

  const transformedPayload = payload.filter((entry) => entry.color !== LINE_COLOR);

  const body = (
    <div className="flex flex-col gap-1">
      {transformedPayload
        .filter((entry) => entry.value !== 0)
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
  );

  let footer = null;
  switch (dataView) {
    case 'net':
      const netCashFlow = payload.find((entry) => entry.dataKey === 'netCashFlow');
      if (!netCashFlow) {
        console.error('Cash flow data not found');
        break;
      }

      footer = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="flex items-center gap-1">
            <ChartLineIcon className="h-3 w-3" />
            <span className="mr-2">Net Cash Flow:</span>
          </span>
          <span className="ml-1 font-semibold">{formatNumber(netCashFlow.value, 3, '$')}</span>
        </p>
      );
      break;
    case 'incomes':
    case 'expenses':
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
    case 'custom':
    case 'savingsRate':
      break;
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span className="mr-2">Age {label}</span>
        <span className="text-muted-foreground ml-1">{yearForAge}</span>
      </p>
      {body}
      {footer}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const LINE_COLOR = 'var(--foreground)';

interface SingleSimulationCashFlowLineChartProps {
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  startAge: number;
  keyMetrics: KeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: 'net' | 'incomes' | 'expenses' | 'custom' | 'savingsRate';
  customDataID?: string;
}

export default function SingleSimulationCashFlowLineChart({
  rawChartData,
  startAge,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  customDataID,
}: SingleSimulationCashFlowLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  let chartData: SingleSimulationCashFlowChartDataPoint[] | Array<{ age: number } & IncomeData> | Array<{ age: number } & ExpenseData> =
    useChartDataSlice(rawChartData, 'single');

  const lineDataKeys: (keyof SingleSimulationCashFlowChartDataPoint | keyof IncomeData | keyof ExpenseData)[] = [];
  const strokeColors: string[] = [];

  const barDataKeys: (keyof SingleSimulationCashFlowChartDataPoint | keyof IncomeData | keyof ExpenseData)[] = [];
  const barColors: string[] = [];

  let formatter = undefined;
  let stackOffset: 'sign' | undefined = undefined;

  switch (dataView) {
    case 'net': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      lineDataKeys.push('netCashFlow');
      strokeColors.push(LINE_COLOR);

      barDataKeys.push('income', 'expenses', 'taxesAndPenalties');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');

      chartData = chartData.map((entry) => ({
        ...entry,
        expenses: -entry.expenses,
        taxesAndPenalties: -entry.taxesAndPenalties,
      }));

      stackOffset = 'sign';
      break;
    }
    case 'incomes': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('earnedIncome', 'socialSecurityIncome', 'taxExemptIncome', 'employerMatch');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)');
      break;
    }
    case 'expenses': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      barDataKeys.push('expenses', 'incomeTax', 'ficaTax', 'capGainsTax', 'niit', 'earlyWithdrawalPenalties');
      barColors.push('var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)');
      break;
    }
    case 'custom': {
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      formatter = (value: number) => formatNumber(value, 1, '$');

      const perIncomeData = chartData.flatMap(({ age, perIncomeData }) =>
        perIncomeData.filter((income) => income.id === customDataID && income.income !== 0).map((income) => ({ age, ...income }))
      );

      if (perIncomeData.length > 0) {
        lineDataKeys.push('income');
        strokeColors.push('var(--chart-2)');

        chartData = perIncomeData;
        break;
      }

      const perExpenseData = chartData.flatMap(({ age, perExpenseData }) =>
        perExpenseData.filter((expense) => expense.id === customDataID && expense.expense !== 0).map((expense) => ({ age, ...expense }))
      );

      if (perExpenseData.length > 0) {
        lineDataKeys.push('expense');
        strokeColors.push('var(--chart-4)');

        chartData = perExpenseData;
        break;
      }

      break;
    }
    case 'savingsRate': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      lineDataKeys.push('savingsRate');
      strokeColors.push('var(--chart-3)');
      break;
    }
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
        stackOffset={stackOffset}
        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
        onClick={onClick}
      >
        <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
        <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
        <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
        {dataView === 'net' && <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />}
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
          <Bar key={`bar-${dataKey}-${i}`} dataKey={dataKey} maxBarSize={20} stackId="stack" fill={barColors[i]} />
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
