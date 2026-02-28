'use client';

import { useState, useCallback, memo } from 'react';
import { AreaChart, Tooltip } from 'recharts';

import type { MultiSimulationPhasesChartDataPoint } from '@/lib/types/chart-data-points';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import { useChartInterval } from '@/hooks/use-chart-interval';

import {
  TimeSeriesChartContainer,
  TooltipContainer,
  TooltipEntryRow,
  ChartGrid,
  TimeSeriesXAxis,
  TimeSeriesYAxis,
  AreaSeries,
  AgeReferenceLines,
} from '../chart-primitives';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof MultiSimulationPhasesChartDataPoint;
    payload: MultiSimulationPhasesChartDataPoint;
  }>;
  label?: number;
  startAge: number;
  disabled: boolean;
}

const CustomTooltip = memo(({ active, payload, label, startAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  return (
    <TooltipContainer label={label!} startAge={startAge}>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <TooltipEntryRow
            key={entry.dataKey}
            dataKey={entry.dataKey}
            color={entry.color}
            formattedValue={`${formatNumber(entry.value * 100, 1)}%`}
          />
        ))}
      </div>
    </TooltipContainer>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface MultiSimulationPhasesAreaChartProps {
  rawChartData: MultiSimulationPhasesChartDataPoint[];
  keyMetrics: KeyMetrics;
  startAge: number;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function MultiSimulationPhasesAreaChart({
  rawChartData,
  keyMetrics,
  startAge,
  onAgeSelect,
  selectedAge,
}: MultiSimulationPhasesAreaChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { foregroundColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData: MultiSimulationPhasesChartDataPoint[] = useChartDataSlice(rawChartData, 'monteCarlo');
  const dataKeys: (keyof MultiSimulationPhasesChartDataPoint)[] = ['percentAccumulation', 'percentRetirement', 'percentBankrupt'];
  const formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

  const interval = useChartInterval(chartData.length);

  const onClick = useCallback(
    (data: { activeLabel: string | number | undefined }) => {
      if (data.activeLabel !== undefined && onAgeSelect) {
        onAgeSelect(Number(data.activeLabel));
      }
    },
    [onAgeSelect]
  );

  return (
    <TimeSeriesChartContainer ref={chartRef}>
      <AreaChart
        responsive
        width="100%"
        height="100%"
        data={chartData}
        className="text-xs"
        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
        tabIndex={-1}
        onClick={onClick}
        stackOffset="expand"
      >
        <ChartGrid />
        <TimeSeriesXAxis interval={interval} />
        <TimeSeriesYAxis formatter={formatter} />
        <AreaSeries dataKeys={dataKeys} areaColors={dataKeys.map((_, index) => COLORS[index % COLORS.length])} stackId="areaStack" />
        <Tooltip
          content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} />}
          cursor={{ stroke: foregroundColor }}
        />
        <AgeReferenceLines keyMetrics={keyMetrics} selectedAge={selectedAge} />
      </AreaChart>
    </TimeSeriesChartContainer>
  );
}
