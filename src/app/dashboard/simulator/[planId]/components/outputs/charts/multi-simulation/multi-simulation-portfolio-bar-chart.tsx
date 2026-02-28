'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { MultiSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';

import { CustomLabelListContent, getBarChartTickConfig, ChartEmptyState, BarChartContainer } from '../chart-primitives';

interface MultiSimulationPortfolioBarChartProps {
  age: number;
  rawChartData: MultiSimulationPortfolioChartDataPoint[];
}

export default function MultiSimulationPortfolioBarChart({ age, rawChartData }: MultiSimulationPortfolioBarChartProps) {
  const { gridColor, foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const formatter = (value: number) => formatCompactCurrency(value, 1);
  const chartData: { name: string; amount: number; color: string }[] = rawChartData
    .filter((item) => item.age === age)
    .flatMap(({ p10PortfolioValue, p25PortfolioValue, p50PortfolioValue, p75PortfolioValue, p90PortfolioValue }) => [
      { name: 'P10 Value', amount: p10PortfolioValue, color: 'var(--chart-1)' },
      { name: 'P25 Value', amount: p25PortfolioValue, color: 'var(--chart-2)' },
      { name: 'P50 Value', amount: p50PortfolioValue, color: 'var(--chart-3)' },
      { name: 'P75 Value', amount: p75PortfolioValue, color: 'var(--chart-4)' },
      { name: 'P90 Value', amount: p90PortfolioValue, color: 'var(--chart-1)' },
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
          <Bar dataKey="amount" maxBarSize={75} minPointSize={20} label={<CustomLabelListContent isSmallScreen={isSmallScreen} />}>
            {chartData.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.color} fillOpacity={0.5} stroke={entry.color} strokeWidth={3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </BarChartContainer>
  );
}
