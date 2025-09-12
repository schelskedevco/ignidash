'use client';

import { useTheme } from 'next-themes';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import { formatNumber, formatChartString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { SingleSimulationContributionsChartDataPoint } from '@/lib/types/chart-data-points';

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
  currentAge: number;
  disabled: boolean;
}

const CustomTooltip = ({ active, payload, label, currentAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (label! - currentAge);

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
            className={`border-foreground/50 flex justify-between rounded-lg border bg-[${entry.color}]/60 px-2 text-sm`}
          >
            <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
            <span className="ml-1 font-semibold">{formatNumber(entry.value, 1, '$')}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

const COLORS = ['var(--chart-4)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

interface SingleSimulationContributionsLineChartProps {
  rawChartData: SingleSimulationContributionsChartDataPoint[];
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  dataView: 'annualAmounts' | 'totalAmounts' | 'account';
}

export default function SingleSimulationContributionsLineChart({
  rawChartData,
  onAgeSelect,
  selectedAge,
  dataView,
}: SingleSimulationContributionsLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const currentAge = useCurrentAge();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData: SingleSimulationContributionsChartDataPoint[] = rawChartData;
  if (chartData.length === 0) {
    return null;
  }

  const dataKeys: (keyof SingleSimulationContributionsChartDataPoint)[] = [];
  const yAxisDomain: [number, number] | undefined = undefined;
  switch (dataView) {
    case 'annualAmounts':
      dataKeys.push('contributionsForPeriod');
      break;
    case 'totalAmounts':
      dataKeys.push('totalContributions');
      break;
    case 'account':
      dataKeys.push('taxable', 'taxDeferred', 'taxFree', 'savings');
      break;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  const calculateInterval = (dataLength: number, desiredTicks = 8) => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks);
  };
  const interval = calculateInterval(chartData.length);

  const onClick = (data: { activeLabel: string | undefined }) => {
    if (data.activeLabel !== undefined && onAgeSelect) {
      onAgeSelect(Number(data.activeLabel));
    }
  };

  return (
    <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1} onClick={onClick}>
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
            <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={COLORS[index % COLORS.length]} />
          ))}
          <Tooltip
            content={<CustomTooltip currentAge={currentAge!} disabled={isSmallScreen && clickedOutsideChart} />}
            cursor={{ stroke: foregroundColor }}
          />
          {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
