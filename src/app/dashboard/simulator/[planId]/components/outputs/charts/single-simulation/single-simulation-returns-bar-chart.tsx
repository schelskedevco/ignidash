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
  let transformedChartData: { name: string; amount: number }[] = [];
  switch (dataView) {
    case 'rates': {
      const [stockLabel, bondLabel, cashLabel, inflationLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.realStockReturn },
        { name: bondLabel, amount: item.realBondReturn },
        { name: cashLabel, amount: item.realCashReturn },
        { name: inflationLabel, amount: item.inflationRate },
      ]);
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      break;
    }
    case 'annualAmounts': {
      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.annualStockGrowth },
        { name: bondLabel, amount: item.annualBondGrowth },
        { name: cashLabel, amount: item.annualCashGrowth },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
    case 'cumulativeAmounts': {
      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.cumulativeStockGrowth },
        { name: bondLabel, amount: item.cumulativeBondGrowth },
        { name: cashLabel, amount: item.cumulativeCashGrowth },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
    case 'custom': {
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        transformedChartData = [];
        break;
      }

      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData
        .flatMap(({ perAccountData }) => perAccountData)
        .filter(({ id }) => id === customDataID)
        .flatMap(({ id, returnAmountsForPeriod }) => [
          { id, name: stockLabel, amount: returnAmountsForPeriod.stocks },
          { id, name: bondLabel, amount: returnAmountsForPeriod.bonds },
          { id, name: cashLabel, amount: returnAmountsForPeriod.cash },
        ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
  }

  if (transformedChartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600

  const shouldUseCustomTick = transformedChartData.length > 3 || (isSmallScreen && transformedChartData.length > 1);
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 100 : 25;

  return (
    <div className="h-full min-h-64 w-full sm:min-h-72 lg:min-h-80 [&_svg:focus]:outline-none">
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
  );
}
