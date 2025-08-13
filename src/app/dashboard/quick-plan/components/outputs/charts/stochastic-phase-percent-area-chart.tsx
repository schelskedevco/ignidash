'use client';

import { useTheme } from 'next-themes';
import { useRef, useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import { useIsMobile } from '@/hooks/use-mobile';

export interface StochasticPhasePercentAreaChartDataPoint {
  age: number;
  percentAccumulation: number;
  percentRetirement: number;
  percentBankrupt: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof StochasticPhasePercentAreaChartDataPoint;
    payload: StochasticPhasePercentAreaChartDataPoint;
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
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-3)]/60 px-2 text-sm">
          <span className="mr-2">Accumulation:</span>
          <span className="ml-1 font-semibold">{`${payload[0].value.toFixed(0)}%`}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-2)]/60 px-2 text-sm">
          <span className="mr-2">Retirement:</span>
          <span className="ml-1 font-semibold">{`${payload[1].value.toFixed(0)}%`}</span>
        </p>
        <p className="border-foreground/50 flex justify-between rounded-lg border bg-[var(--chart-1)]/60 px-2 text-sm">
          <span className="mr-2">Bankrupt:</span>
          <span className="ml-1 font-semibold">{`${payload[2].value.toFixed(0)}%`}</span>
        </p>
      </div>
    </div>
  );
};

interface StochasticPhasePercentAreaChartProps {
  chartData: StochasticPhasePercentAreaChartDataPoint[];
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function StochasticPhasePercentAreaChart({ chartData, onAgeSelect, selectedAge }: StochasticPhasePercentAreaChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const currentAge = useCurrentAge();

  useEffect(() => {
    const handleInteractionStart = (event: MouseEvent | TouchEvent) => {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setClickedOutsideChart(true);
      } else {
        setClickedOutsideChart(false);
      }
    };

    document.addEventListener('mousedown', handleInteractionStart);
    document.addEventListener('touchstart', handleInteractionStart);

    return () => {
      document.removeEventListener('mousedown', handleInteractionStart);
      document.removeEventListener('touchstart', handleInteractionStart);
    };
  }, []);

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
    <div>
      <div ref={chartRef} className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            className="text-xs"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            tabIndex={-1}
            onClick={onClick}
          >
            <defs>
              <linearGradient id="colorPercentAccumulation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorPercentRetirement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorPercentBankrupt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
            <YAxis
              tick={{ fill: foregroundMutedColor }}
              axisLine={false}
              hide={isSmallScreen}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Area
              type="monotone"
              dataKey="percentAccumulation"
              stackId="1"
              stroke="var(--chart-3)"
              fill="url(#colorPercentAccumulation)"
              activeDot={false}
            />
            <Area
              type="monotone"
              dataKey="percentRetirement"
              stackId="1"
              stroke="var(--chart-2)"
              fill="url(#colorPercentRetirement)"
              activeDot={false}
            />
            <Area
              type="monotone"
              dataKey="percentBankrupt"
              stackId="1"
              stroke="var(--chart-1)"
              fill="url(#colorPercentBankrupt)"
              activeDot={false}
            />
            <Tooltip
              content={<CustomTooltip currentAge={currentAge!} disabled={isSmallScreen && clickedOutsideChart} />}
              cursor={{ stroke: foregroundColor }}
            />
            {selectedAge && <ReferenceLine x={selectedAge} stroke={foregroundMutedColor} strokeWidth={1} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div
        className={`mt-2 flex justify-center gap-x-2 sm:gap-x-4 ${!isSmallScreen ? 'ml-16' : ''}`}
        role="group"
        aria-label="Chart legend"
      >
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-3)]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Accumulation
        </div>
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-2)]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Retirement
        </div>
        <div className="flex items-center gap-x-1 text-sm font-medium">
          <svg viewBox="0 0 6 6" aria-hidden="true" className="size-5 fill-[var(--chart-1)]">
            <circle r={2.5} cx={3} cy={3} />
          </svg>
          Bankrupt
        </div>
      </div>
    </div>
  );
}
