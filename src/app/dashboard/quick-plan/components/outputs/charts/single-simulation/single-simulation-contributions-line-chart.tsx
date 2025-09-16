'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { formatNumber, formatChartString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationContributionsChartDataPoint } from '@/lib/types/chart-data-points';
import type { FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof SingleSimulationContributionsChartDataPoint;
    payload: SingleSimulationContributionsChartDataPoint;
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
            className={`border-foreground/50 flex justify-between rounded-lg border px-2 text-sm ${needsBgTextColor.includes(entry.color) ? 'text-background' : 'text-foreground'}`}
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">{formatNumber(entry.value, 1, '$')}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface SingleSimulationContributionsLineChartProps {
  rawChartData: SingleSimulationContributionsChartDataPoint[];
  keyMetrics: FixedReturnsKeyMetricsV2;
  showReferenceLines: boolean;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: 'annualAmounts' | 'totalAmounts' | 'taxTreatment';
  startAge: number;
}

export default function SingleSimulationContributionsLineChart({
  rawChartData,
  keyMetrics,
  showReferenceLines,
  onAgeSelect,
  selectedAge,
  dataView,
  startAge,
}: SingleSimulationContributionsLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData: SingleSimulationContributionsChartDataPoint[] = rawChartData;

  const dataKeys: (keyof SingleSimulationContributionsChartDataPoint)[] = [];
  const yAxisDomain: [number, number] | undefined = undefined;
  switch (dataView) {
    case 'annualAmounts':
      dataKeys.push('annualContributions');
      break;
    case 'totalAmounts':
      dataKeys.push('totalContributions');
      break;
    case 'taxTreatment':
      dataKeys.push('taxable', 'taxDeferred', 'taxFree', 'cashSavings');
      break;
  }

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
          <LineChart
            data={chartData}
            className="text-xs"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            tabIndex={-1}
            onClick={onClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              hide={isSmallScreen}
              tickFormatter={(value: number) => formatNumber(value, 1, '$')}
              domain={yAxisDomain}
            />
            {dataKeys.map((dataKey, index) => (
              <Line
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={COLORS[index % COLORS.length]}
                dot={false}
                activeDot={false}
                strokeWidth={3}
              />
            ))}
            <Tooltip
              content={<CustomTooltip startAge={startAge} disabled={isSmallScreen && clickedOutsideChart} />}
              cursor={{ stroke: foregroundColor }}
            />
            {keyMetrics.retirementAge && showReferenceLines && (
              <ReferenceLine x={Math.round(keyMetrics.retirementAge)} stroke={foregroundMutedColor} strokeDasharray="10 5" />
            )}
            {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        className={`mt-2 flex justify-center gap-x-2 sm:gap-x-4 ${!isSmallScreen ? 'ml-16' : ''}`}
        role="group"
        aria-label="Chart legend"
      >
        {dataKeys.map((dataKey, index) => (
          <div key={dataKey} className="flex items-center gap-x-2 text-sm font-medium">
            <svg viewBox="0 0 6 6" aria-hidden="true" style={{ fill: COLORS[index % COLORS.length] }} className="size-5 shrink-0">
              <circle r={2.5} cx={3} cy={3} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
            </svg>
            {formatChartString(dataKey)}
          </div>
        ))}
      </div>
    </div>
  );
}
