'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer /* Tooltip */ } from 'recharts';

import { useFixedReturnsCashFlowChartData } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
}

const CustomLabel = ({ x, y, width, height, value }: CustomLabelProps) => {
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-sm font-semibold sm:text-base"
    >
      {formatNumber(value, 1, '$')}
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

  const allChartData = useFixedReturnsCashFlowChartData().filter((item) => item.age === age);

  let inflowBar = null;
  let outflowBar = null;
  let netBar = null;
  let chartData = allChartData;

  switch (mode) {
    case 'inflowOutflow':
      const inflows = chartData.filter((item) => item.amount >= 0);
      const outflows = chartData.filter((item) => item.amount < 0);

      const inflowData: Record<string, number | string> = { age, name: 'Inflows' };
      const inflowBarKeys = new Set<string>();

      inflows.forEach((item) => {
        inflowData[item.name] = item.amount;
        inflowBarKeys.add(item.name);
      });

      const outflowData: Record<string, number | string> = { age, name: 'Outflows' };
      const outflowBarKeys = new Set<string>();

      outflows.forEach((item) => {
        outflowData[item.name] = Math.abs(item.amount);
        outflowBarKeys.add(item.name);
      });

      chartData = [inflowData, outflowData] as typeof chartData;

      inflowBar = Array.from(inflowBarKeys).map((key, index) => {
        const barRadius: [number, number, number, number] | undefined = index === inflowBarKeys.size - 1 ? [8, 8, 0, 0] : undefined;
        return <Bar key={key} dataKey={key} stackId="a" radius={barRadius} stroke="var(--chart-1)" fill="var(--chart-3)" />;
      });
      outflowBar = Array.from(outflowBarKeys).map((key, index) => {
        const barRadius: [number, number, number, number] | undefined = index === outflowBarKeys.size - 1 ? [8, 8, 0, 0] : undefined;
        return <Bar key={key} dataKey={key} stackId="a" radius={barRadius} stroke="var(--chart-1)" fill="var(--chart-3)" />;
      });
      break;
    case 'net':
      chartData = [{ age, name: 'Net', amount: chartData.reduce((sum, item) => sum + item.amount, 0) }];
      netBar = <Bar dataKey="amount" label={CustomLabel} radius={[8, 8, 0, 0]} stroke="var(--chart-1)" fill="var(--chart-3)" />;
      break;
  }

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

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
          />
          {inflowBar}
          {outflowBar}
          {netBar}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
