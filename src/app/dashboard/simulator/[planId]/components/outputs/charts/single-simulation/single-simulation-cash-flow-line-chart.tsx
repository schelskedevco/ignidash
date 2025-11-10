'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';
import type { IncomeData } from '@/lib/calc/incomes';
import type { ExpenseData } from '@/lib/calc/expenses';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { useLineChartLegendEffectOpacity } from '@/hooks/use-line-chart-legend-effect-opacity';

import TimeSeriesLegend from '../time-series-legend';

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

const CustomTooltip = ({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

  const formatValue = (value: number, mode: 'net' | 'incomes' | 'expenses' | 'custom' | 'savingsRate') => {
    switch (mode) {
      case 'savingsRate':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return formatNumber(value, 1, '$');
    }
  };

  let tooltipBodyComponent = null;
  let tooltipFooterComponent = null;
  switch (dataView) {
    case 'net':
      const entry: SingleSimulationCashFlowChartDataPoint = payload[0].payload as SingleSimulationCashFlowChartDataPoint;

      const earnedIncome = entry.earnedIncome;
      const taxExemptIncome = entry.taxExemptIncome;
      const taxesAndPenalties = entry.totalTaxesAndPenalties;
      const expenses = entry.expenses;
      const cashFlow = entry.cashFlow;

      tooltipBodyComponent = (
        <div className="flex flex-col gap-2">
          <p
            style={{ backgroundColor: 'var(--chart-2)' }}
            className="border-foreground/50 text-foreground flex justify-between rounded-lg border px-2 text-sm"
          >
            <span className="mr-2">{`${formatChartString('earnedIncome')}:`}</span>
            <span className="ml-1 font-semibold">{formatNumber(earnedIncome, 1, '$')}</span>
          </p>
          {taxExemptIncome !== 0 && (
            <p
              style={{ backgroundColor: 'var(--chart-2)' }}
              className="border-foreground/50 text-foreground flex justify-between rounded-lg border px-2 text-sm"
            >
              <span className="mr-2">{`${formatChartString('taxExemptIncome')}:`}</span>
              <span className="ml-1 font-semibold">{formatNumber(taxExemptIncome, 1, '$')}</span>
            </p>
          )}
          <p
            style={{ backgroundColor: 'var(--chart-4)' }}
            className="border-foreground/50 text-background flex justify-between rounded-lg border px-2 text-sm"
          >
            <span className="mr-2">{`${formatChartString('taxesAndPenalties')}:`}</span>
            <span className="ml-1 font-semibold">{formatNumber(taxesAndPenalties, 1, '$')}</span>
          </p>
          <p
            style={{ backgroundColor: 'var(--chart-4)' }}
            className="border-foreground/50 text-background flex justify-between rounded-lg border px-2 text-sm"
          >
            <span className="mr-2">{`${formatChartString('expenses')}:`}</span>
            <span className="ml-1 font-semibold">{formatNumber(expenses, 1, '$')}</span>
          </p>
        </div>
      );
      tooltipFooterComponent = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="mr-2">Cash Flow:</span>
          <span className="ml-1 font-semibold">{formatNumber(cashFlow, 3, '$')}</span>
        </p>
      );
      break;
    case 'incomes':
    case 'expenses':
      tooltipBodyComponent = (
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
      );
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
      break;
    case 'custom':
    case 'savingsRate':
      tooltipBodyComponent = (
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
      );
      break;
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      {tooltipBodyComponent}
      {tooltipFooterComponent}
    </div>
  );
};

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
    rawChartData;

  const dataKeys: (keyof SingleSimulationCashFlowChartDataPoint | keyof IncomeData | keyof ExpenseData)[] = [];
  const strokeColors: string[] = [];
  let formatter = undefined;
  switch (dataView) {
    case 'net':
      dataKeys.push('cashFlow');
      strokeColors.push('url(#colorGradient)');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'incomes':
      dataKeys.push('earnedIncome', 'taxExemptIncome');
      strokeColors.push('var(--chart-2)', 'var(--chart-1)');
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'expenses':
      dataKeys.push('expenses', 'incomeTax', 'capGainsTax', 'otherTaxes');
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
        dataKeys.push('income');
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
        dataKeys.push('expense');
        strokeColors.push('var(--chart-4)');
        formatter = (value: number) => formatNumber(value, 1, '$');
        break;
      }

      break;
    case 'savingsRate':
      dataKeys.push('savingsRate');
      strokeColors.push('var(--chart-3)');
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#18181b'; // zinc-100 : zinc-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600
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
            {dataKeys.map((dataKey, index) => (
              <Line
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColors[index]}
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
        colors={strokeColors}
        legendStrokeColor={legendStrokeColor}
        dataKeys={dataKeys}
        isSmallScreen={isSmallScreen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
