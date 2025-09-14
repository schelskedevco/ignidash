'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';
import type { IncomeData } from '@/lib/calc/v2/incomes';
import type { ExpenseData } from '@/lib/calc/v2/expenses';
import type { FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationCashFlowChartDataPoint;
    payload: SingleSimulationCashFlowChartDataPoint;
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
}

const CustomTooltip = ({ active, payload, label, startAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

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
            style={{ backgroundColor: `hsl(from ${entry.color} h s l / 0.6)` }}
            className="border-foreground/50 flex justify-between rounded-lg border px-2 text-sm"
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">{formatNumber(entry.value, 3, '$')}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

const COLORS = ['var(--chart-4)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

interface SingleSimulationCashFlowLineChartProps {
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  startAge: number;
  keyMetrics: FixedReturnsKeyMetricsV2;
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
  switch (dataView) {
    case 'net':
      dataKeys.push('netCashFlow');
      break;
    case 'incomes':
      dataKeys.push('grossIncome');
      break;
    case 'expenses':
      dataKeys.push('expenses');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      const perIncomeData = chartData.flatMap(({ age, perIncomeData }) => {
        return Object.values(perIncomeData)
          .map((income) => ({ age, ...income }))
          .filter((income) => income.id === customDataID);
      });

      if (perIncomeData.length > 0) {
        yAxisDomain = [
          Math.min(0, ...perIncomeData.map((d) => d.grossIncome * 1.25)),
          Math.max(0, ...perIncomeData.map((d) => d.grossIncome * 1.25)),
        ];
        chartData = perIncomeData;
        dataKeys.push('grossIncome');
        break;
      }

      const perExpenseData = chartData.flatMap(({ age, perExpenseData }) => {
        return Object.values(perExpenseData)
          .map((expense) => ({ age, ...expense }))
          .filter((expense) => expense.id === customDataID);
      });

      if (perExpenseData.length > 0) {
        yAxisDomain = [
          Math.min(0, ...perExpenseData.map((d) => d.amount * 1.25)),
          Math.max(0, ...perExpenseData.map((d) => d.amount * 1.25)),
        ];
        chartData = perExpenseData;
        dataKeys.push('amount');
        break;
      }

      break;
    default:
      dataKeys.push('netCashFlow');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

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
    <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1} onClick={onClick}>
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
            <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={COLORS[index % COLORS.length]} />
          ))}
          <Tooltip
            content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} />}
            cursor={{ stroke: foregroundColor }}
          />
          {keyMetrics.retirementAge && showReferenceLines && (
            <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
          )}
          {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
