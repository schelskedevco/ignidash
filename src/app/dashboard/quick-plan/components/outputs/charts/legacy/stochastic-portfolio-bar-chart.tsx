'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList /* Tooltip */ } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface StochasticPortfolioBarChartDataPoint {
  age: number;
  name: string;
  amount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen, mode } = props;
  if (!value || value === 0) {
    return null;
  }

  let displayValue = value;
  switch (mode) {
    case 'percentiles':
      displayValue = formatNumber(value, 1, '$');
      break;
    case 'counts':
      displayValue = value.toFixed(0);
      break;
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
      <tspan className="font-semibold">{displayValue}</tspan>
    </text>
  );
};

interface StochasticPortfolioBarChartProps {
  selectedAge: number;
  mode: 'percentiles' | 'distribution';
  rawChartData: StochasticPortfolioBarChartDataPoint[];
}

export default function StochasticPortfolioBarChart({ selectedAge, mode, rawChartData }: StochasticPortfolioBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  let formatter;
  switch (mode) {
    case 'percentiles':
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'distribution':
      formatter = (value: number) => value.toFixed(0);
      break;
  }

  const chartData = rawChartData.filter((item) => item.age === selectedAge);
  if (chartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  return (
    <div className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="name" />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} hide={isSmallScreen} tickFormatter={formatter} />
          <Bar dataKey="amount" fill="var(--chart-3)" stroke="var(--chart-1)" maxBarSize={250} minPointSize={20}>
            <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent mode={mode} isSmallScreen={isSmallScreen} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
