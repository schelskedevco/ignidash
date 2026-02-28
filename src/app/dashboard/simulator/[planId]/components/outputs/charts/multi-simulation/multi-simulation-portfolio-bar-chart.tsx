'use client';

import { BarChart, ResponsiveContainer } from 'recharts';

import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { MultiSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';

import {
  getBarChartTickConfig,
  ChartEmptyState,
  BarChartContainer,
  ChartGrid,
  BarChartXAxis,
  BarChartYAxis,
  StandardBar,
} from '../chart-primitives';

interface MultiSimulationPortfolioBarChartProps {
  age: number;
  rawChartData: MultiSimulationPortfolioChartDataPoint[];
}

export default function MultiSimulationPortfolioBarChart({ age, rawChartData }: MultiSimulationPortfolioBarChartProps) {
  const { foregroundMutedColor } = useChartTheme();
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
          <ChartGrid />
          <BarChartXAxis tick={tick} />
          <BarChartYAxis formatter={formatter} />
          <StandardBar data={chartData} />
        </BarChart>
      </ResponsiveContainer>
    </BarChartContainer>
  );
}
