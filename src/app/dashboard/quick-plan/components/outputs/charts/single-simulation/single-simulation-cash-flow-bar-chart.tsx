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

interface SingleSimulationCashFlowBarChartProps {
  age: number;
  dataView: 'cashFlow' | 'incomes' | 'expenses';
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
}

export default function SingleSimulationCashFlowBarChart({ age, dataView, rawChartData }: SingleSimulationCashFlowBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const yAxisDomain: [number, number] | undefined = undefined;
  const chartData = rawChartData.filter((item) => item.age === age);

  let transformedChartData: { name: string; amount: number }[] = [];
  switch (dataView) {
    case 'cashFlow':
      transformedChartData = chartData
        .flatMap(({ perIncomeData, perExpenseData }) =>
          perIncomeData
            .map(({ name, grossIncome }) => ({ name, amount: grossIncome, type: 'income' }))
            .concat(perExpenseData.map(({ name, amount }) => ({ name, amount: -amount, type: 'expense' })))
        )
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      break;
    case 'incomes':
      transformedChartData = chartData.flatMap(({ perIncomeData }) =>
        perIncomeData.map(({ name, grossIncome }) => ({ name, amount: grossIncome }))
      );
      break;
    case 'expenses':
      transformedChartData = chartData.flatMap(({ perExpenseData }) => perExpenseData.map(({ name, amount }) => ({ name, amount })));
      break;
  }

  if (transformedChartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  return (
    <div>
      <div className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={transformedChartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="name" />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              hide={isSmallScreen}
              tickFormatter={(value: number) => formatNumber(value, 1, '$')}
              domain={yAxisDomain}
            />
            <Bar dataKey="amount" maxBarSize={75} minPointSize={20}>
              {transformedChartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill="var(--chart-3)" stroke="var(--chart-1)" />
              ))}
              <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent isSmallScreen={isSmallScreen} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
