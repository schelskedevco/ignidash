'use client';

import { BarChart, ResponsiveContainer } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { MultiSimulationPhasesChartDataPoint } from '@/lib/types/chart-data-points';

import {
  getBarChartTickConfig,
  ChartEmptyState,
  BarChartContainer,
  ChartGrid,
  BarChartXAxis,
  BarChartYAxis,
  StandardBar,
} from '../chart-primitives';

interface MultiSimulationPhasesBarChartProps {
  age: number;
  rawChartData: MultiSimulationPhasesChartDataPoint[];
}

export default function MultiSimulationPhasesBarChart({ age, rawChartData }: MultiSimulationPhasesBarChartProps) {
  const { foregroundMutedColor } = useChartTheme();
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
          <ChartGrid />
          <BarChartXAxis tick={tick} />
          <BarChartYAxis formatter={formatter} />
          <StandardBar data={chartData} formatValue={(v: number) => formatNumber(v, 0)} />
        </BarChart>
      </ResponsiveContainer>
    </BarChartContainer>
  );
}
