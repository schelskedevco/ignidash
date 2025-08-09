'use client';

import { useTheme } from 'next-themes';
import { useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

import { useFixedReturnsCashFlowChartData } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface FixedCashFlowChartProps {
  age: number;
}

export default function FixedCashFlowChart({ age }: FixedCashFlowChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const allChartData = useFixedReturnsCashFlowChartData();
  const chartData = allChartData.filter((item) => item.age === age);

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600
  const barColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

  return (
    <div ref={chartRef} className="h-64 w-full sm:h-80 lg:h-96 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="name" />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 1)}
          />
          <Bar dataKey="amount" onClick={() => {}}>
            {chartData.map((item, index) => (
              <Cell cursor="pointer" fill={barColors[(index + 2) % barColors.length]} key={`cell-${index}`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
