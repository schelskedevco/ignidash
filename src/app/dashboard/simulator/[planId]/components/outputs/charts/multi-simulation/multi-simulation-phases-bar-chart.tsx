'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { MultiSimulationPhasesChartDataPoint } from '@/lib/types/chart-data-points';

import { CustomLabelListContent, getBarChartTickConfig, ChartEmptyState, BarChartContainer } from '../chart-primitives';

interface MultiSimulationPhasesBarChartProps {
  age: number;
  rawChartData: MultiSimulationPhasesChartDataPoint[];
}

export default function MultiSimulationPhasesBarChart({ age, rawChartData }: MultiSimulationPhasesBarChartProps) {
  const { gridColor, foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const formatter = (value: number) => formatNumber(value, 0);
  const chartData: { name: string; amount: number; color: string }[] = rawChartData
    .filter((item) => item.age === age)
    .flatMap(({ numberAccumulation, numberRetirement, numberBankrupt }) => [
      { name: 'Accum. Count', amount: numberAccumulation, color: 'var(--chart-1)' },
      { name: 'Retirement Count', amount: numberRetirement, color: 'var(--chart-2)' },
      { name: 'Bankrupt Count', amount: numberBankrupt, color: 'var(--chart-3)' },
    ]);

  if (chartData.length === 0) {
    return <ChartEmptyState />;
  }

  const { tick, bottomMargin } = getBarChartTickConfig(chartData.length, isSmallScreen, foregroundMutedColor);

  return (
    <BarChartContainer>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} className="text-xs" margin={{ top: 5, right: 10, left: 10, bottom: bottomMargin }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
          <Bar
            dataKey="amount"
            maxBarSize={75}
            minPointSize={20}
            label={<CustomLabelListContent isSmallScreen={isSmallScreen} formatValue={(v: number) => formatNumber(v, 0)} />}
          >
            {chartData.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.color} fillOpacity={0.5} stroke={entry.color} strokeWidth={3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </BarChartContainer>
  );
}
