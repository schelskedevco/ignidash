'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell /* Tooltip */ } from 'recharts';

import { useFixedReturnsCashFlowChartData } from '@/lib/stores/quick-plan-store';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface FixedReturnsCashFlowBarChartProps {
  simulation: SimulationResult;
  selectedAge: number;
  mode: 'inflowOutflow' | 'net';
}

export default function FixedReturnsCashFlowBarChart({ simulation, selectedAge, mode }: FixedReturnsCashFlowBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  let yAxisDomain: [number, number] | undefined = undefined;
  let chartData = useFixedReturnsCashFlowChartData(simulation)
    .filter((item) => item.age === selectedAge && item.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
  let bar = null;

  switch (mode) {
    case 'inflowOutflow':
      bar = (
        <Bar dataKey="amount" maxBarSize={250} minPointSize={20}>
          {chartData.map((entry, index) => {
            const fillColor = entry.amount >= 0 ? 'var(--chart-3)' : 'var(--chart-2)';
            return <Cell key={`cell-${index}`} fill={fillColor} stroke="var(--chart-1)" />;
          })}
          <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent isSmallScreen={isSmallScreen} />} />
        </Bar>
      );
      break;
    case 'net':
      const netAmount = chartData.reduce((sum, item) => sum + item.amount, 0);

      yAxisDomain = [Math.min(0, netAmount * 1.25), Math.max(0, netAmount * 1.25)];
      chartData = [{ age: selectedAge, name: 'Net Cash Flow', amount: netAmount }];
      bar = (
        <Bar dataKey="amount" maxBarSize={250} minPointSize={20}>
          {chartData.map((entry, index) => {
            const fillColor = entry.amount >= 0 ? 'var(--chart-3)' : 'var(--chart-2)';
            return <Cell key={`cell-${index}`} fill={fillColor} stroke="var(--chart-1)" />;
          })}
          <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent isSmallScreen={isSmallScreen} />} />
        </Bar>
      );
      break;
  }

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  return (
    <div>
      <div className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="name" />
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
      <div
        className={`mt-2 flex justify-center gap-x-2 sm:gap-x-4 ${!isSmallScreen ? 'ml-16' : ''}`}
        role="group"
        aria-label="Chart legend"
      >
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-3)] stroke-[var(--chart-1)] stroke-[0.4]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Inflow
        </div>
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-2)] stroke-[var(--chart-1)] stroke-[0.4]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Outflow
        </div>
      </div>
    </div>
  );
}
