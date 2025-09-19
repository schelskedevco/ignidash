'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';
import type { IncomeData } from '@/lib/calc/v2/incomes';
import type { ExpenseData } from '@/lib/calc/v2/expenses';
import type { SingleSimulationKeyMetrics } from '@/lib/types/key-metrics';
import { Divider } from '@/components/catalyst/divider';

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
  dataView: 'net' | 'incomes' | 'expenses' | 'custom';
}

const CustomTooltip = ({ active, payload, label, startAge, disabled, dataView }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

  if (dataView === 'custom') {
    const payloadData = payload[0];
    const cashFlowName = (payloadData.payload as ({ age: number } & IncomeData) | ({ age: number } & ExpenseData)).name;
    const bgColor = 'grossIncome' in payloadData.payload ? 'var(--chart-2)' : 'var(--chart-4)';

    return (
      <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
        <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
          <span>Age {label}</span>
          <span className="text-muted-foreground">{yearForAge}</span>
        </p>
        <p
          style={{ backgroundColor: bgColor }}
          className={`border-foreground/50 flex justify-between rounded-lg border px-2 text-sm ${needsBgTextColor.includes(payloadData.color) ? 'text-background' : 'text-foreground'}`}
        >
          <span className="mr-2">{`${cashFlowName}:`}</span>
          <span className="ml-1 font-semibold">{formatNumber(payloadData.value, 1, '$')}</span>
        </p>
      </div>
    );
  }

  const perIncomeData = payload
    .flatMap((entry) => (entry.payload as SingleSimulationCashFlowChartDataPoint).perIncomeData)
    .filter((income) => income.grossIncome !== 0);
  const totalGrossIncome = perIncomeData.reduce((sum, income) => sum + income.grossIncome, 0);
  const incomeDataListComponent = perIncomeData.map((income) => (
    <p
      key={income.id}
      style={{ backgroundColor: 'var(--chart-2)' }}
      className="border-foreground/50 flex justify-between rounded-lg border px-2 text-sm"
    >
      <span className="mr-2">{income.name}</span>
      <span className="ml-1 font-semibold">{formatNumber(income.grossIncome, 1, '$')}</span>
    </p>
  ));

  const perExpenseData = payload
    .flatMap((entry) => (entry.payload as SingleSimulationCashFlowChartDataPoint).perExpenseData)
    .filter((expense) => expense.amount !== 0);
  const totalExpenses = perExpenseData.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseDataListComponent = perExpenseData.map((expense) => (
    <p
      key={expense.id}
      style={{ backgroundColor: 'var(--chart-4)' }}
      className="border-foreground/50 text-background flex justify-between rounded-lg border px-2 text-sm"
    >
      <span className="mr-2">{expense.name}</span>
      <span className="ml-1 font-semibold">{formatNumber(expense.amount, 1, '$')}</span>
    </p>
  ));

  let tooltipBodyComponent = null;
  let tooltipFooterComponent = null;
  switch (dataView) {
    case 'net':
      tooltipBodyComponent = (
        <>
          {incomeDataListComponent}
          <Divider />
          {expenseDataListComponent}
        </>
      );
      tooltipFooterComponent = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="mr-2">Net Cash Flow:</span>
          <span className="ml-1 font-semibold">{formatNumber(totalGrossIncome - totalExpenses, 1, '$')}</span>
        </p>
      );
      break;
    case 'incomes':
      tooltipBodyComponent = incomeDataListComponent;
      tooltipFooterComponent = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="mr-2">Total Gross Income:</span>
          <span className="ml-1 font-semibold">{formatNumber(totalGrossIncome, 1, '$')}</span>
        </p>
      );
      break;
    case 'expenses':
      tooltipBodyComponent = expenseDataListComponent;
      tooltipFooterComponent = (
        <p className="mx-1 mt-2 flex justify-between text-sm font-semibold">
          <span className="mr-2">Total Expenses:</span>
          <span className="ml-1 font-semibold">{formatNumber(totalExpenses, 1, '$')}</span>
        </p>
      );
      break;
  }

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-2">{tooltipBodyComponent}</div>
      {tooltipFooterComponent}
    </div>
  );
};

interface SingleSimulationCashFlowLineChartProps {
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  startAge: number;
  keyMetrics: SingleSimulationKeyMetrics;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: 'net' | 'incomes' | 'expenses' | 'custom';
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
  let yAxisDomain: [number, number] | undefined = undefined;
  let strokeColor: string;
  switch (dataView) {
    case 'net':
      yAxisDomain = [
        Math.min(0, ...chartData.map((d) => d.netCashFlow * 1.25)),
        Math.max(0, ...chartData.map((d) => d.netCashFlow * 1.25)),
      ];
      dataKeys.push('netCashFlow');
      strokeColor = 'url(#colorGradient)';
      break;
    case 'incomes':
      yAxisDomain = [
        Math.min(0, ...chartData.map((d) => d.totalGrossIncome * 1.25)),
        Math.max(0, ...chartData.map((d) => d.totalGrossIncome * 1.25)),
      ];
      dataKeys.push('totalGrossIncome');
      strokeColor = 'var(--chart-2)';
      break;
    case 'expenses':
      yAxisDomain = [
        Math.min(0, ...chartData.map((d) => d.totalExpenses * 1.25)),
        Math.max(0, ...chartData.map((d) => d.totalExpenses * 1.25)),
      ];
      dataKeys.push('totalExpenses');
      strokeColor = 'var(--chart-4)';
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      const perIncomeData = chartData.flatMap(({ age, perIncomeData }) => {
        return Object.values(perIncomeData)
          .map((income) => ({ age, ...income }))
          .filter((income) => income.id === customDataID && income.grossIncome !== 0);
      });

      if (perIncomeData.length > 0) {
        yAxisDomain = [
          Math.min(0, ...perIncomeData.map((d) => d.grossIncome * 1.25)),
          Math.max(0, ...perIncomeData.map((d) => d.grossIncome * 1.25)),
        ];
        chartData = perIncomeData;
        dataKeys.push('grossIncome');
        strokeColor = 'var(--chart-2)';
        break;
      }

      const perExpenseData = chartData.flatMap(({ age, perExpenseData }) => {
        return Object.values(perExpenseData)
          .map((expense) => ({ age, ...expense }))
          .filter((expense) => expense.id === customDataID && expense.amount !== 0);
      });

      if (perExpenseData.length > 0) {
        yAxisDomain = [
          Math.min(0, ...perExpenseData.map((d) => d.amount * 1.25)),
          Math.max(0, ...perExpenseData.map((d) => d.amount * 1.25)),
        ];
        chartData = perExpenseData;
        dataKeys.push('amount');
        strokeColor = 'var(--chart-4)';
        break;
      }

      break;
    default:
      dataKeys.push('netCashFlow');
      strokeColor = 'url(#colorGradient)';
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
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              hide={isSmallScreen}
              tickFormatter={(value: number) => formatNumber(value, 1, '$')}
              domain={yAxisDomain}
            />
            {dataKeys.map((dataKey, index) => (
              <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={strokeColor} dot={false} activeDot={false} strokeWidth={3} />
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
      <div
        className={`mt-2 flex justify-center gap-x-2 sm:gap-x-4 ${!isSmallScreen ? 'ml-16' : ''}`}
        role="group"
        aria-label="Chart legend"
      >
        <div className="flex items-center gap-x-2 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" style={{ fill: 'var(--chart-2)' }} className="size-5 shrink-0">
            <circle r={2.5} cx={3} cy={3} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
          </svg>
          Income
        </div>
        <div className="flex items-center gap-x-2 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" style={{ fill: 'var(--chart-4)' }} className="size-5 shrink-0">
            <circle r={2.5} cx={3} cy={3} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
          </svg>
          Expense
        </div>
      </div>
    </div>
  );
}
