'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList /* Tooltip */ } from 'recharts';

import { useFixedReturnsCashFlowChartData } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || value === 0) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs sm:text-sm"
    >
      <tspan className="font-semibold">{formatNumber(value, 1, '$')}</tspan>
    </text>
  );
};

interface FixedCashFlowChartProps {
  age: number;
  mode: 'inflowOutflow' | 'net';
}

export default function FixedCashFlowChart({ age, mode }: FixedCashFlowChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  let bar = null;
  let chartData = useFixedReturnsCashFlowChartData()
    .filter((item) => item.age === age)
    .sort((a, b) => b.amount - a.amount);

  switch (mode) {
    case 'inflowOutflow':
      bar = (
        <Bar dataKey="amount" stroke="var(--chart-1)" fill="var(--chart-3)" maxBarSize={250} minPointSize={20}>
          <LabelList dataKey="amount" position="middle" content={CustomLabelListContent} />
        </Bar>
      );
      break;
    case 'net':
      chartData = [{ age, name: 'Net Cash Flow', amount: chartData.reduce((sum, item) => sum + item.amount, 0) }];
      bar = (
        <Bar dataKey="amount" stroke="var(--chart-1)" fill="var(--chart-3)" maxBarSize={250} minPointSize={20}>
          <LabelList dataKey="amount" position="middle" content={CustomLabelListContent} />
        </Bar>
      );
      break;
  }

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  let yAxisDomain: [number, number] | undefined = undefined;
  if (mode === 'net') {
    const netValue = chartData[0].amount;
    yAxisDomain = [Math.min(0, netValue * 1.25), Math.max(0, netValue * 1.25)];
  }

  return (
    <div className="h-64 w-full sm:h-80 lg:h-96 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis axisLine={false} dataKey="name" />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 1, '$')}
            domain={yAxisDomain}
          />
          {bar}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
