'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { MultiSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen } = props;
  if (!value || value === 0) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + (isSmallScreen ? offset : 0)}
      fill="var(--foreground)"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs sm:text-sm"
    >
      <tspan className="font-semibold">{formatNumber(value, 1, '$')}</tspan>
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomizedAxisTick = ({ x, y, stroke, payload }: any) => {
  const truncateText = (text: string, maxLength = 24) => {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '…' : text;
  };

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="currentColor" transform="rotate(-35)" fontSize={12}>
        {truncateText(payload.value)}
      </text>
    </g>
  );
};

interface MultiSimulationPortfolioBarChartProps {
  age: number;
  rawChartData: MultiSimulationPortfolioChartDataPoint[];
}

export default function MultiSimulationPortfolioBarChart({ age, rawChartData }: MultiSimulationPortfolioBarChartProps) {
  const { gridColor, foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const formatter = (value: number) => formatNumber(value, 1, '$');
  const chartData: { name: string; amount: number; color: string }[] = rawChartData
    .filter((item) => item.age === age)
    .flatMap(({ p10PortfolioValue, p25PortfolioValue, p50PortfolioValue, p75PortfolioValue, p90PortfolioValue }) => [
      { name: 'P10 Value', amount: p10PortfolioValue, color: 'var(--chart-1)' },
      { name: 'P25 Value', amount: p25PortfolioValue, color: 'var(--chart-2)' },
      { name: 'P50 Value', amount: p50PortfolioValue, color: 'var(--chart-3)' },
      { name: 'P75 Value', amount: p75PortfolioValue, color: 'var(--chart-4)' },
      { name: 'P90 Value', amount: p90PortfolioValue, color: 'var(--chart-1)' },
    ]);

  if (chartData.length === 0) {
    return <div className="flex h-72 w-full items-center justify-center sm:h-84 lg:h-96">No data available for the selected view.</div>;
  }

  const shouldUseCustomTick = chartData.length > 3 || (isSmallScreen && chartData.length > 1);
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 100 : 25;

  return (
    <div className="h-full min-h-72 w-full sm:min-h-84 lg:min-h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} className="text-xs" margin={{ top: 5, right: 10, left: 10, bottom: bottomMargin }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
          <Bar dataKey="amount" maxBarSize={75} minPointSize={20} label={<CustomLabelListContent isSmallScreen={isSmallScreen} />}>
            {chartData.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.color} fillOpacity={0.5} stroke={entry.color} strokeWidth={3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
