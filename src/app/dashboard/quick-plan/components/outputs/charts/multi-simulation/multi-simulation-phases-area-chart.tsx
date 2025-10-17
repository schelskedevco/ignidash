'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import type { MultiSimulationPhasesChartDataPoint } from '@/lib/types/chart-data-points';
import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';

import TimeSeriesLegend from '../time-series-legend';

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

const CustomTooltip = ({ active, payload, label, startAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

  return (
    <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
      <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
        <span>Age {label}</span>
        <span className="text-muted-foreground">{yearForAge}</span>
      </p>
      <div className="flex flex-col gap-2">
        {payload.map((entry) => (
          <p
            key={entry.dataKey}
            style={{ backgroundColor: entry.color }}
            className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
              'text-background': needsBgTextColor.includes(entry.color),
            })}
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">{formatNumber(entry.value * 100, 1)}%</span>
          </p>
        ))}
      </div>
    </div>
  );
};

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface MultiSimulationPhasesAreaChartProps {
  rawChartData: MultiSimulationPhasesChartDataPoint[];
  startAge: number;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function MultiSimulationPhasesAreaChart({
  rawChartData,
  startAge,
  onAgeSelect,
  selectedAge,
}: MultiSimulationPhasesAreaChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData: MultiSimulationPhasesChartDataPoint[] = rawChartData;
  const dataKeys: (keyof MultiSimulationPhasesChartDataPoint)[] = ['percentAccumulation', 'percentRetirement', 'percentBankrupt'];

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600
  const legendStrokeColor = resolvedTheme === 'dark' ? 'white' : 'black';

  const calculateInterval = useCallback((dataLength: number, desiredTicks = 8) => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks);
  }, []);
  const interval = calculateInterval(chartData.length);

  const onClick = useCallback(
    (data: { activeLabel: string | undefined }) => {
      if (data.activeLabel !== undefined && onAgeSelect) {
        onAgeSelect(Number(data.activeLabel));
      }
    },
    [onAgeSelect]
  );

  return (
    <div>
      <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            className="text-xs"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            tabIndex={-1}
            onClick={onClick}
            stackOffset="expand"
          >
            <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} dataKey="age" interval={interval} />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              tickLine={false}
              hide={isSmallScreen}
              tickFormatter={(value: number) => `${(value * 100).toFixed(1)}%`}
            />
            {dataKeys.map((dataKey, index) => (
              <Area
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={1}
                activeDot={false}
              />
            ))}
            <Tooltip
              content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} />}
              cursor={{ stroke: foregroundColor }}
            />
            {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <TimeSeriesLegend colors={COLORS} legendStrokeColor={legendStrokeColor} dataKeys={dataKeys} isSmallScreen={isSmallScreen} />
    </div>
  );
}
