'use client';

import { useTheme } from 'next-themes';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { StochasticReturnsChartDataPoint } from '@/lib/types/chart-data-points';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof StochasticReturnsChartDataPoint;
    payload: StochasticReturnsChartDataPoint;
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
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-1)]/60 px-2 text-sm">
          <span className="mr-2">Stocks:</span>
          <span className="ml-1 font-semibold">{`${(payload[0].value * 100).toFixed(2)}%`}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-2)]/60 px-2 text-sm">
          <span className="mr-2">Bonds:</span>
          <span className="ml-1 font-semibold">{`${(payload[1].value * 100).toFixed(2)}%`}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-3)]/60 px-2 text-sm">
          <span className="mr-2">Cash:</span>
          <span className="ml-1 font-semibold">{`${(payload[2].value * 100).toFixed(2)}%`}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-1)]/60 px-2 text-sm">
          <span className="mr-2">Inflation:</span>
          <span className="ml-1 font-semibold">{`${(payload[3].value * 100).toFixed(2)}%`}</span>
        </p>
      </div>
    </div>
  );
};

interface StochasticReturnsLineChartProps {
  rawChartData: StochasticReturnsChartDataPoint[];
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function StochasticReturnsLineChart({ rawChartData, onAgeSelect, selectedAge }: StochasticReturnsLineChartProps) {
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const currentAge = useCurrentAge();

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData = useMemo(
    () =>
      Object.values(
        rawChartData.reduce(
          (acc, item) => {
            if (!acc[item.age]) {
              acc[item.age] = { age: item.age };
            }
            acc[item.age][item.name] = item.rate;
            return acc;
          },
          {} as Record<number, { age: number; [key: string]: number | null }>
        )
      ),
    [rawChartData]
  );
  if (chartData.length === 0) {
    return null;
  }

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  const interval = 5;

  const onClick = (data: { activeLabel: string | undefined }) => {
    if (data.activeLabel !== undefined && onAgeSelect) {
      onAgeSelect(Number(data.activeLabel));
    }
  };

  return (
    <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1} onClick={onClick}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => `${(value * 100).toFixed(2)}%`}
          />
          <Line type="monotone" dataKey="Stocks" stroke="var(--chart-1)" />
          <Line type="monotone" dataKey="Bonds" stroke="var(--chart-2)" />
          <Line type="monotone" dataKey="Cash" stroke="var(--chart-3)" />
          <Line type="monotone" dataKey="Inflation" stroke="var(--chart-1)" />
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
