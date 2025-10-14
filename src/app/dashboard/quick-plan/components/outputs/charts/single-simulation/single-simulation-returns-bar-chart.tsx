'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell /* Tooltip */ } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen, dataView } = props;
  if (!value || value === 0) {
    return null;
  }

  const formatValue = (value: number, mode: 'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'custom') => {
    switch (mode) {
      case 'rates':
        return `${(value * 100).toFixed(1)}%`;
      case 'annualAmounts':
      case 'cumulativeAmounts':
      case 'custom':
        return formatNumber(value, 1, '$');
      default:
        return value;
    }
  };

  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + (isSmallScreen ? offset : 0)}
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs sm:text-sm"
    >
      <tspan className="font-semibold">{formatValue(value, dataView)}</tspan>
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomizedAxisTick = ({ x, y, stroke, payload }: any) => {
  const truncateText = (text: string, maxLength = 18) => {
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

const COLORS = ['var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--foreground)'];

interface SingleSimulationReturnsBarChartProps {
  age: number;
  dataView: 'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'custom';
  rawChartData: SingleSimulationReturnsChartDataPoint[];
  customDataID: string;
}

export default function SingleSimulationReturnsBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationReturnsBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const chartData = rawChartData.filter((item) => item.age === age);

  let formatter = undefined;
  let transformedChartData: { name: string; amount: number }[] = [];
  switch (dataView) {
    case 'rates':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Stocks Rate', amount: item.stocksRate },
        { name: 'Bonds Rate', amount: item.bondsRate },
        { name: 'Cash Rate', amount: item.cashRate },
        { name: 'Inflation Rate', amount: item.inflationRate },
      ]);
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      break;
    case 'annualAmounts':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Stocks Amount', amount: item.annualStocksAmount },
        { name: 'Bonds Amount', amount: item.annualBondsAmount },
        { name: 'Cash Amount', amount: item.annualCashAmount },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'cumulativeAmounts':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Cumulative Stocks', amount: item.cumulativeStocksAmount },
        { name: 'Cumulative Bonds', amount: item.cumulativeBondsAmount },
        { name: 'Cumulative Cash', amount: item.cumulativeCashAmount },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'custom':
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        transformedChartData = [];
        break;
      }

      transformedChartData = [
        ...chartData
          .flatMap(({ perAccountData }) =>
            perAccountData.flatMap(({ id, returnAmountsForPeriod }) => [
              { id, name: 'Stocks Amount', amount: returnAmountsForPeriod.stocks },
              { id, name: 'Bonds Amount', amount: returnAmountsForPeriod.bonds },
              { id, name: 'Cash Amount', amount: returnAmountsForPeriod.cash },
            ])
          )
          .filter(({ id }) => id === customDataID),
      ];
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
  }

  if (transformedChartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

  const shouldUseCustomTick = transformedChartData.length > 5 || isSmallScreen;
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 50 : 0;

  return (
    <div>
      <div className="h-64 w-full sm:h-72 lg:h-80 [&_svg:focus]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={transformedChartData}
            className="text-xs"
            margin={{ top: 0, right: 10, left: 10, bottom: bottomMargin }}
            tabIndex={-1}
          >
            <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
            <XAxis tick={tick} axisLine={false} tickLine={false} dataKey="name" interval={0} />
            <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
            <Bar dataKey="amount" maxBarSize={250} minPointSize={20}>
              {transformedChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  fillOpacity={0.5}
                />
              ))}
              <LabelList
                dataKey="amount"
                position="middle"
                content={<CustomLabelListContent isSmallScreen={isSmallScreen} dataView={dataView} />}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
