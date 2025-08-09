'use client';

import { useTheme } from 'next-themes';
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
        <span className="ml-1 font-semibold">{formatNumber(payload[0].payload.amount, 3, '$')}</span>
      </p>
    </div>
  );
};

interface CustomLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
}

const CustomLabel = ({ x, y, width, height, value }: CustomLabelProps) => {
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-sm font-semibold sm:text-base"
    >
      {formatNumber(value, 1, '$')}
    </text>
  );
};

interface FixedCashFlowChartProps {
  age: number;
}

export default function FixedCashFlowChart({ age }: FixedCashFlowChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const allChartData = useFixedReturnsCashFlowChartData();
  const chartData = allChartData.filter((item) => item.age === age);

  if (chartData.length === 0) {
    return null;
  }

  const netCashFlow = chartData.reduce((sum, item) => sum + item.amount, 0);
  const chartDataWithNet = [...chartData, { age, name: 'Net', amount: netCashFlow }];

  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#d1d5db'; // gray-700 : gray-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d1d5db' : '#4b5563'; // gray-300 : gray-600
  const barColors = ['var(--chart-2)', 'var(--chart-3)'];

  return (
    <div className="h-64 w-full sm:h-80 lg:h-96 [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartDataWithNet} className="text-xs" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis tick={{ fill: foregroundMutedColor }} axisLine={false} dataKey="name" />
          <YAxis
            tick={{ fill: foregroundMutedColor }}
            axisLine={false}
            hide={isSmallScreen}
            tickFormatter={(value: number) => formatNumber(value, 1, '$')}
          />
          {/* <Tooltip cursor={false} content={<CustomTooltip selectedAge={age} disabled={isSmallScreen && clickedOutsideChart} />} /> */}
          <Bar dataKey="amount" onClick={() => {}} label={CustomLabel} radius={[8, 8, 0, 0]}>
            {chartDataWithNet.map((item, index) => (
              <Cell fill={barColors[(index + 2) % barColors.length]} stroke="var(--chart-1)" key={`cell-${index}`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
