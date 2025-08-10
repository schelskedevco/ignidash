'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList /* Tooltip */ } from 'recharts';

import { useFixedReturnsCashFlowChartData } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, value, label } = props;
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
      {label && <tspan>{label}: </tspan>}
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
        return (
          <Bar key={key} dataKey={key} stackId="a" stroke="var(--chart-1)" fill="var(--chart-3)" maxBarSize={250}>
            <LabelList dataKey={key} position="middle" content={<CustomLabelListContent label={key} />} />
          </Bar>
        );
      });
      outflowBar = Array.from(outflowBarKeys).map((key, index) => {
        return (
          <Bar key={key} dataKey={key} stackId="a" stroke="var(--chart-1)" fill="var(--chart-3)" maxBarSize={250}>
            <LabelList dataKey={key} position="middle" content={<CustomLabelListContent label={key} />} />
          </Bar>
        );
      });
      break;
    case 'net':
      chartData = [{ age, name: 'Net', amount: chartData.reduce((sum, item) => sum + item.amount, 0) }];
      netBar = (
        <Bar dataKey="amount" stroke="var(--chart-1)" fill="var(--chart-3)" maxBarSize={250}>
          <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent label="Net" />} />
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
          {inflowBar}
          {outflowBar}
          {netBar}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
