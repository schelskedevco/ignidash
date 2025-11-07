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
  const truncateText = (text: string, maxLength = 24) => {
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
  dataView: 'net' | 'incomes' | 'expenses' | 'custom' | 'savingsRate';
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  customDataID: string;
}

export default function SingleSimulationCashFlowBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationCashFlowBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    net: {
      mobile: ['Earned Income', 'Exempt Income', 'Taxes', 'Expenses'],
      desktop: ['Earned Income', 'Tax-Exempt Income', 'Taxes & Penalties', 'Expenses'],
    },
    expenses: {
      mobile: ['Taxes'],
      desktop: ['Taxes & Penalties'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  let transformedChartData: { name: string; amount: number; type: string }[] = [];
  const formatter = (value: number) => formatNumber(value, 1, '$');
  switch (dataView) {
    case 'net': {
      const [earnedIncomeLabel, taxExemptIncomeLabel, taxesAndPenaltiesLabel, expensesLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );
      transformedChartData = chartData.flatMap(({ earnedIncome, taxExemptIncome, expenses, totalTaxesAndPenalties }) => [
        { name: earnedIncomeLabel, amount: earnedIncome, type: 'income' },
        ...(taxExemptIncome > 0 ? [{ name: taxExemptIncomeLabel, amount: taxExemptIncome, type: 'income' }] : []),
        { name: taxesAndPenaltiesLabel, amount: -totalTaxesAndPenalties, type: 'expense' },
        { name: expensesLabel, amount: -expenses, type: 'expense' },
      ]);
      break;
    }
    case 'incomes':
      transformedChartData = chartData.flatMap(({ perIncomeData }) =>
        perIncomeData.map(({ name, income }) => ({ name, amount: income, type: 'income' }))
      );
      break;
    case 'expenses': {
      const [taxesAndPenaltiesLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap(({ perExpenseData, totalTaxesAndPenalties }) =>
        perExpenseData
          .map(({ name, expense }) => ({ name, amount: expense, type: 'expense' }))
          .concat({ name: taxesAndPenaltiesLabel, amount: totalTaxesAndPenalties, type: 'expense' })
      );
      break;
    }
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        transformedChartData = [];
        break;
      }

      transformedChartData = [
        ...chartData
          .flatMap(({ perIncomeData }) => perIncomeData.map(({ id, name, income }) => ({ id, name, amount: income, type: 'income' })))
          .filter(({ id }) => id === customDataID),
        ...chartData
          .flatMap(({ perExpenseData }) => perExpenseData.map(({ id, name, expense }) => ({ id, name, amount: expense, type: 'expense' })))
          .filter(({ id }) => id === customDataID),
      ];
      break;
    case 'savingsRate':
      break;
  }

  if (transformedChartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600
  const incomeBarColor = 'var(--chart-2)';
  const expenseBarColor = 'var(--chart-4)';

  const shouldUseCustomTick = transformedChartData.length > 3 || (isSmallScreen && transformedChartData.length > 1);
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 100 : 25;

  return (
    <div className="h-full min-h-64 w-full sm:min-h-72 lg:min-h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedChartData}
          className="text-xs"
          margin={{ top: 0, right: 10, left: 10, bottom: bottomMargin }}
          tabIndex={-1}
        >
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} tickLine={false} dataKey="name" interval={0} />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
          <Bar dataKey="amount" maxBarSize={250} minPointSize={20}>
            {transformedChartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.type === 'income' ? incomeBarColor : expenseBarColor}
                stroke={entry.type === 'income' ? incomeBarColor : expenseBarColor}
                strokeWidth={3}
                fillOpacity={0.5}
              />
            ))}
            <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent isSmallScreen={isSmallScreen} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
