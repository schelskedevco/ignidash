'use client';

import { useState, useCallback, memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

import type { MultiSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { useClickDetection } from '@/hooks/use-outside-click';
import { useChartDataSlice } from '@/hooks/use-chart-data-slice';
import { useChartInterval } from '@/hooks/use-chart-interval';

import { TimeSeriesChartContainer, TooltipContainer, TooltipEntryRow } from '../chart-primitives';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof MultiSimulationPortfolioChartDataPoint;
    payload: MultiSimulationPortfolioChartDataPoint;
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
            formattedValue={formatCompactCurrency(entry.value, 1)}
          />
        ))}
      </div>
    </TooltipContainer>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

const COLORS = ['var(--chart-3)', 'var(--chart-2)', 'var(--chart-1)'];

interface MultiSimulationPortfolioAreaChartProps {
  rawChartData: MultiSimulationPortfolioChartDataPoint[];
  keyMetrics: KeyMetrics;
  startAge: number;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function MultiSimulationPortfolioAreaChart({
  rawChartData,
  keyMetrics,
  startAge,
  onAgeSelect,
  selectedAge,
}: MultiSimulationPortfolioAreaChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { gridColor, foregroundColor, foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData: MultiSimulationPortfolioChartDataPoint[] = useChartDataSlice(rawChartData, 'monteCarlo');
  const dataKeys: (keyof MultiSimulationPortfolioChartDataPoint)[] = ['p75PortfolioValue', 'p50PortfolioValue', 'p25PortfolioValue'];
  const formatter = (value: number) => formatCompactCurrency(value, 1);

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
      >
        <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
        <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
        <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
        {dataKeys.map((dataKey, index) => (
          <Area
            key={dataKey}
            type="monotone"
            dataKey={dataKey}
            stroke={COLORS[index]}
            fill={COLORS[index]}
            fillOpacity={1}
            activeDot={false}
          />
        ))}
        <Tooltip
          content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} />}
          cursor={{ stroke: foregroundColor }}
        />
        {keyMetrics.retirementAge && (
          <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
        )}
        {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1.5} ifOverflow="visible" />}
        {keyMetrics.portfolioAtRetirement && (
          <ReferenceLine y={Math.round(keyMetrics.portfolioAtRetirement)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
        )}
      </AreaChart>
    </TimeSeriesChartContainer>
  );
}
