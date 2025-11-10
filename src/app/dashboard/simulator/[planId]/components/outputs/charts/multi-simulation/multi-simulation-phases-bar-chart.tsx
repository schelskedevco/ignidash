'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell /* Tooltip */ } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MultiSimulationPhasesChartDataPoint } from '@/lib/types/chart-data-points';

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
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs sm:text-sm"
    >
      <tspan className="font-semibold">{formatNumber(value, 0)}</tspan>
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

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

interface MultiSimulationPhasesBarChartProps {
  age: number;
  rawChartData: MultiSimulationPhasesChartDataPoint[];
}

export default function MultiSimulationPhasesBarChart({ age, rawChartData }: MultiSimulationPhasesBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartData: { name: string; amount: number }[] = rawChartData
    .filter((item) => item.age === age)
    .flatMap(({ numberAccumulation, numberRetirement, numberBankrupt }) => [
      { name: 'Accum. Count', amount: numberAccumulation },
      { name: 'Retirement Count', amount: numberRetirement },
      { name: 'Bankrupt Count', amount: numberBankrupt },
    ]);

  if (chartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600

  const shouldUseCustomTick = chartData.length > 3 || (isSmallScreen && chartData.length > 1);
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 100 : 25;

  return (
    <div className="h-full min-h-64 w-full sm:min-h-72 lg:min-h-80 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: bottomMargin }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} tickLine={false} dataKey="name" interval={0} />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            tickLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 0)}
          />
          <Bar dataKey="amount" maxBarSize={250} minPointSize={20}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={3}
                fillOpacity={0.5}
              />
            ))}
            <LabelList dataKey="amount" position="middle" content={<CustomLabelListContent isSmallScreen={isSmallScreen} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
