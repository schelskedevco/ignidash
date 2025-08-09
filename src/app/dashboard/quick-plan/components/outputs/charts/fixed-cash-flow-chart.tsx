'use client';

import { useTheme } from 'next-themes';
import { useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell /* Tooltip */ } from 'recharts';

import { useFixedReturnsCashFlowChartData } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CashFlowChartDataPoint {
  age: number;
  amount: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof CashFlowChartDataPoint;
    payload: CashFlowChartDataPoint;
  }>;
  label?: number;
  selectedAge: number;
  disabled: boolean;
}

const _CustomTooltip = ({ active, payload, label, selectedAge, disabled }: CustomTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  return (
    <div className="text-foreground bg-background rounded-lg border p-3 shadow-md">
      <p className="border-foreground/50 mb-2 flex justify-between border-b pb-2 text-sm font-semibold">
        <span>Age</span>
        <span className="text-muted-foreground">{selectedAge}</span>
      </p>
      <p className="flex justify-between text-sm font-semibold">
        <span className="mr-2">{label}:</span>
        <span className="ml-1 font-semibold">{formatNumber(payload[0].payload.amount, 3)}</span>
      </p>
    </div>
  );
};

interface FixedCashFlowChartProps {
  age: number;
}

export default function FixedCashFlowChart({ age }: FixedCashFlowChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [_, setClickedOutsideChart] = useState(false);

  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const allChartData = useFixedReturnsCashFlowChartData();
  const chartData = allChartData.filter((item) => item.age === age);

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
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600
  const barColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

  return (
    <div ref={chartRef} className="h-64 w-full sm:h-80 lg:h-96 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="name" />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 1)}
          />
          {/* <Tooltip cursor={false} content={<CustomTooltip selectedAge={age} disabled={isSmallScreen && clickedOutsideChart} />} /> */}
          <Bar dataKey="amount" onClick={() => {}}>
            {chartData.map((item, index) => (
              <Cell cursor="pointer" fill={barColors[(index + 2) % barColors.length]} key={`cell-${index}`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
