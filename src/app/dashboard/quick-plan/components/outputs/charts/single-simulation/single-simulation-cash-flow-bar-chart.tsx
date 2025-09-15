'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell /* Tooltip */ } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen } = props;
  if (!value || value === 0) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + (isSmallScreen ? offset : 0)}
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs sm:text-sm"
    >
      <tspan className="font-semibold">{formatNumber(value, 1, '$')}</tspan>
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomizedAxisTick = ({ x, y, stroke, payload }: any) => {
  const truncateText = (text: string, maxLength = 18) => {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '…' : text;
  };

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="currentColor" transform="rotate(-35)" fontSize={12}>
        {truncateText(payload.value)}
      </text>
    </g>
  );
};

interface SingleSimulationCashFlowBarChartProps {
  age: number;
  dataView: 'net' | 'incomes' | 'expenses' | 'custom';
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  customDataID?: string;
}

export default function SingleSimulationCashFlowBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationCashFlowBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartData = rawChartData.filter((item) => item.age === age);

  let transformedChartData: { name: string; amount: number; type: string }[] = [];
  switch (dataView) {
    case 'net':
      transformedChartData = chartData.flatMap(({ perIncomeData, perExpenseData }) => [
        { name: 'Total Gross Income', amount: perIncomeData.reduce((sum, { grossIncome }) => sum + grossIncome, 0), type: 'income' },
        { name: 'Total Expenses', amount: -perExpenseData.reduce((sum, { amount }) => sum + amount, 0), type: 'expense' },
      ]);
      break;
    case 'incomes':
      transformedChartData = chartData
        .flatMap(({ perIncomeData }) => perIncomeData.map(({ name, grossIncome }) => ({ name, amount: grossIncome, type: 'income' })))
        .filter(({ amount }) => amount !== 0);
      break;
    case 'expenses':
      transformedChartData = chartData
        .flatMap(({ perExpenseData }) => perExpenseData.map(({ name, amount }) => ({ name, amount, type: 'expense' })))
        .filter(({ amount }) => amount !== 0);
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        transformedChartData = [];
        break;
      }

      transformedChartData = [
        ...chartData
          .flatMap(({ perIncomeData }) =>
            perIncomeData.map(({ id, name, grossIncome }) => ({ id, name, amount: grossIncome, type: 'income' }))
          )
          .filter(({ id, amount }) => amount !== 0 && id === customDataID),
        ...chartData
          .flatMap(({ perExpenseData }) => perExpenseData.map(({ id, name, amount }) => ({ id, name, amount, type: 'expense' })))
          .filter(({ id, amount }) => amount !== 0 && id === customDataID),
      ];
      break;
  }

  if (transformedChartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600
  const incomeBarColor = 'rgb(16, 185, 129)'; // emerald-500
  const expenseBarColor = 'rgb(244, 63, 94)'; // rose-500

  const shouldUseCustomTick = transformedChartData.length > 5 || isSmallScreen;
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 50 : 0;

  return (
    <div className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedChartData}
          className="text-xs"
          margin={{ top: 0, right: 10, left: 10, bottom: bottomMargin }}
          tabIndex={-1}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 1, '$')}
          />
          <Bar dataKey="amount" maxBarSize={150} minPointSize={20}>
            {transformedChartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.type === 'income' ? incomeBarColor : expenseBarColor}
                stroke={entry.type === 'income' ? incomeBarColor : expenseBarColor}
                fillOpacity={0.25}
              />
            ))}
            <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent isSmallScreen={isSmallScreen} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
