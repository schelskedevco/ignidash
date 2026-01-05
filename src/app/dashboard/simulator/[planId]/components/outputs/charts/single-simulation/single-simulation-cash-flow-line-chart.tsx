'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback, memo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
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
import TimeSeriesLegend from '@/components/time-series-legend';

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

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)', 'var(--foreground)'];

  const formatValue = (value: number, mode: 'net' | 'incomes' | 'expenses' | 'custom' | 'savingsRate') => {
    switch (mode) {
      case 'savingsRate':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return formatNumber(value, 1, '$');
    }
  };

  const transformedPayload = payload.filter((entry) => entry.dataKey !== 'cashFlow');

  const tooltipBodyComponent = (
    <div className="flex flex-col gap-1">
      {transformedPayload.map((entry) => (
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
  );

  let tooltipFooterComponent = null;
  switch (dataView) {
    case 'net':
      const cashFlow = payload.find((entry) => entry.dataKey === 'cashFlow')!;

      tooltipFooterComponent = (
        <p className="mx-1 mt-2 flex justify-between text-xs font-semibold">
          <span className="flex items-center gap-1">
            <ChartLineIcon className="h-3 w-3" />
            <span className="mr-2">Net Cash Flow:</span>
          </span>
          <span className="ml-1 font-semibold">{formatNumber(cashFlow.value, 3, '$')}</span>
        </p>
      );
      break;
    case 'incomes':
    case 'expenses':
      tooltipFooterComponent = (
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
    case 'custom':
    case 'savingsRate':
      break;
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-xs font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      {tooltipBodyComponent}
      {tooltipFooterComponent}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

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
    useChartDataSlice(rawChartData);

  const lineDataKeys: (keyof SingleSimulationCashFlowChartDataPoint | keyof IncomeData | keyof ExpenseData)[] = [];
  const strokeColors: string[] = [];
  let formatter = undefined;
  let bar = null;
  let stackOffset: 'sign' | undefined = undefined;
  switch (dataView) {
    case 'net':
      lineDataKeys.push('cashFlow');
      strokeColors.push('var(--foreground)');
      formatter = (value: number) => formatNumber(value, 1, '$');

      const barDataKeys: (keyof SingleSimulationCashFlowChartDataPoint)[] = ['income', 'expenses', 'taxesAndPenalties'];
      const barColors = ['var(--chart-2)', 'var(--chart-1)', 'var(--chart-3)'];

      chartData = chartData.map((entry) => ({
        ...entry,
        expenses: -entry.expenses,
        taxesAndPenalties: -entry.taxesAndPenalties,
      }));

      bar = barDataKeys.map((dataKey, index) => (
        <Bar key={`bar-${dataKey}`} dataKey={dataKey} maxBarSize={20} stackId="stack" fill={barColors[index]} isAnimationActive={false} />
      ));
      stackOffset = 'sign';
      break;
    case 'incomes':
      lineDataKeys.push('earnedIncome', 'socialSecurityIncome', 'taxExemptIncome');
      strokeColors.push('var(--chart-2)', 'var(--chart-1)', 'var(--chart-3)');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'expenses':
      lineDataKeys.push('expenses', 'incomeTax', 'capGainsTax', 'otherTaxes');
      strokeColors.push('var(--chart-4)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      const perIncomeData = chartData.flatMap(({ age, perIncomeData }) =>
        Object.values(perIncomeData)
          .map((income) => ({ age, ...income }))
          .filter((income) => income.id === customDataID && income.income !== 0)
      );

      if (perIncomeData.length > 0) {
        chartData = perIncomeData;
        lineDataKeys.push('income');
        strokeColors.push('var(--chart-2)');
        formatter = (value: number) => formatNumber(value, 1, '$');
        break;
      }

      const perExpenseData = chartData.flatMap(({ age, perExpenseData }) =>
        Object.values(perExpenseData)
          .map((expense) => ({ age, ...expense }))
          .filter((expense) => expense.id === customDataID && expense.expense !== 0)
      );

      if (perExpenseData.length > 0) {
        chartData = perExpenseData;
        lineDataKeys.push('expense');
        strokeColors.push('var(--chart-4)');
        formatter = (value: number) => formatNumber(value, 1, '$');
        break;
      }

      break;
    case 'savingsRate':
      lineDataKeys.push('savingsRate');
      strokeColors.push('var(--chart-3)');
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#18181b'; // zinc-100 : zinc-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600
  const legendStrokeColor = resolvedTheme === 'dark' ? 'white' : 'black';

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

  const { getOpacity, handleMouseEnter, handleMouseLeave } = useLineChartLegendEffectOpacity();

  return (
    <div>
      <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            className="text-xs"
            stackOffset={stackOffset}
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            tabIndex={-1}
            onClick={onClick}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" />
                <stop offset="50%" stopColor="var(--chart-2)" />
                <stop offset="50%" stopColor="var(--chart-4)" />
                <stop offset="100%" stopColor="var(--chart-4)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
            <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
            {lineDataKeys.map((dataKey, index) => (
              <Line
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColors[index]}
                dot={false}
                activeDot={true}
                strokeWidth={3}
                strokeOpacity={getOpacity(dataKey)}
              />
            ))}
            {bar}
            <Tooltip
              content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} dataView={dataView} />}
              cursor={{ stroke: foregroundColor }}
            />
            {keyMetrics.retirementAge && showReferenceLines && (
              <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
            )}
            {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1.5} ifOverflow="visible" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <TimeSeriesLegend
        colors={strokeColors}
        legendStrokeColor={legendStrokeColor}
        dataKeys={lineDataKeys}
        isSmallScreen={isSmallScreen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
