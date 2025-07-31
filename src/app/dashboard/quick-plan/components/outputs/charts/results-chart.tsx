'use client';

import { useTheme } from 'next-themes';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import { ChartDataPoint } from '@/lib/calc/analysis/charts';
import { useFixedReturnsChartData, useFixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof ChartDataPoint;
    payload: ChartDataPoint;
  }>;
  label?: number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!(active && payload && payload.length)) return null;

  console.log('CustomTooltip payload:', payload);

  return (
    <div className="text-foreground bg-background rounded-lg border p-3 shadow-md">
      <p className="mb-1 border-b pb-1 text-sm font-medium">Age {label}</p>
      <div className="flex flex-col gap-2">
        <p className="flex justify-between rounded-lg bg-[var(--chart-3)] px-2 text-sm">
          <span className="mr-2">Stocks:</span>
          <span className="ml-1 font-medium">{formatNumber(payload[0].value, 3)}</span>
        </p>
        <p className="flex justify-between rounded-lg bg-[var(--chart-2)] px-2 text-sm">
          <span className="mr-2">Bonds:</span>
          <span className="ml-1 font-medium">{formatNumber(payload[1].value, 3)}</span>
        </p>
        <p className="flex justify-between rounded-lg bg-[var(--chart-1)] px-2 text-sm">
          <span className="mr-2">Cash:</span>
          <span className="ml-1 font-medium">{formatNumber(payload[2].value, 3)}</span>
        </p>
        <p className="flex justify-between rounded-lg px-2 text-sm">
          <span className="mr-2">Total:</span>
          <span className="ml-1 font-medium">
            {formatNumber(
              payload.reduce((sum, item) => sum + item.value, 0),
              3
            )}
          </span>
        </p>
      </div>
    </div>
  );
};

export default function ResultsChart() {
  const { theme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartData = useFixedReturnsChartData();
  const fireAnalysis = useFixedReturnsAnalysis();

  if (chartData.length === 0) {
    return null;
  }

  const gridColor = theme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundColor = theme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
  const foregroundMutedColor = theme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600

  const interval = isSmallScreen ? 4 : 3;

  return (
    <div className="[&_svg:focus]:outline-primary h-64 w-full sm:h-80 lg:h-96 [&_svg:focus]:rounded-lg [&_svg:focus]:outline-2 [&_svg:focus]:outline-offset-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorStocks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="colorBonds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="age" interval={interval} />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 1)}
          />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="stocks" stackId="1" stroke="var(--chart-3)" fill="url(#colorStocks)" activeDot={false} />
          <Area type="monotone" dataKey="bonds" stackId="1" stroke="var(--chart-2)" fill="url(#colorBonds)" activeDot={false} />
          <Area type="monotone" dataKey="cash" stackId="1" stroke="var(--chart-1)" fill="url(#colorCash)" activeDot={{ r: 5 }} />
          {fireAnalysis.fireAge && (
            <ReferenceLine
              x={Math.round(fireAnalysis.fireAge!)}
              stroke={foregroundColor}
              strokeDasharray="10 5"
              label={{ value: 'FIRE', position: 'insideBottomLeft', fill: foregroundColor }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
