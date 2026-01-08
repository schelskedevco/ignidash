'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

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
      fill="var(--foreground)"
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

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    rates: {
      mobile: ['Stock Return', 'Bond Return', 'Cash Return', 'Inflation Rate'],
      desktop: ['Real Stock Return', 'Real Bond Return', 'Real Cash Return', 'Inflation Rate'],
    },
    annualAmounts: {
      mobile: ['Stock Growth', 'Bond Growth', 'Cash Growth'],
      desktop: ['Annual Stock Growth', 'Annual Bond Growth', 'Annual Cash Growth'],
    },
    cumulativeAmounts: {
      mobile: ['Cumul. Stock', 'Cumul. Bond', 'Cumul. Cash'],
      desktop: ['Cumul. Stock Growth', 'Cumul. Bond Growth', 'Cumul. Cash Growth'],
    },
    custom: {
      mobile: ['Stock Growth', 'Bond Growth', 'Cash Growth'],
      desktop: ['Annual Stock Growth', 'Annual Bond Growth', 'Annual Cash Growth'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  let formatter = undefined;
  let transformedChartData: { name: string; amount: number; color: string }[] = [];

  switch (dataView) {
    case 'rates': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      const [stockLabel, bondLabel, cashLabel, inflationLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.realStockReturn, color: 'var(--chart-2)' },
        { name: bondLabel, amount: item.realBondReturn, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.realCashReturn, color: 'var(--chart-4)' },
        { name: inflationLabel, amount: item.inflationRate, color: 'var(--foreground)' },
      ]);
      break;
    }
    case 'annualAmounts': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.annualStockGrowth, color: 'var(--chart-2)' },
        { name: bondLabel, amount: item.annualBondGrowth, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.annualCashGrowth, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'cumulativeAmounts': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.cumulativeStockGrowth, color: 'var(--chart-2)' },
        { name: bondLabel, amount: item.cumulativeBondGrowth, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.cumulativeCashGrowth, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'custom': {
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        transformedChartData = [];
        break;
      }

      formatter = (value: number) => formatNumber(value, 1, '$');

      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData
        .flatMap(({ perAccountData }) => perAccountData)
        .filter(({ id }) => id === customDataID)
        .flatMap(({ id, returnAmountsForPeriod }) => [
          { id, name: stockLabel, amount: returnAmountsForPeriod.stocks, color: 'var(--chart-2)' },
          { id, name: bondLabel, amount: returnAmountsForPeriod.bonds, color: 'var(--chart-3)' },
          { id, name: cashLabel, amount: returnAmountsForPeriod.cash, color: 'var(--chart-4)' },
        ]);
      break;
    }
  }

  transformedChartData = transformedChartData.sort((a, b) => b.amount - a.amount);
  if (transformedChartData.length === 0) {
    return <div className="flex h-72 w-full items-center justify-center sm:h-84 lg:h-96">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#18181b'; // zinc-100 : zinc-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600

  const shouldUseCustomTick = transformedChartData.length > 3 || (isSmallScreen && transformedChartData.length > 1);
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 100 : 25;

  return (
    <div className="h-full min-h-72 w-full sm:min-h-84 lg:min-h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedChartData}
          className="text-xs"
          margin={{ top: 5, right: 10, left: 10, bottom: bottomMargin }}
          tabIndex={-1}
        >
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
          <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />
          <Bar
            dataKey="amount"
            maxBarSize={75}
            minPointSize={20}
            label={<CustomLabelListContent isSmallScreen={isSmallScreen} dataView={dataView} />}
          >
            {transformedChartData.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.color} fillOpacity={0.5} stroke={entry.color} strokeWidth={3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
