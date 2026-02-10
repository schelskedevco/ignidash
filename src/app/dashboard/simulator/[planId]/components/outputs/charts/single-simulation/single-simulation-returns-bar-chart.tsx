'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';
import type { ReturnsDataView } from '@/lib/types/chart-data-views';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen, dataView } = props;
  if (!value || value === 0) {
    return null;
  }

  const formatValue = (value: number, mode: ReturnsDataView) => {
    switch (mode) {
      case 'rates':
      case 'cagr':
        return `${(value * 100).toFixed(1)}%`;
      case 'annualAmounts':
      case 'cumulativeAmounts':
      case 'taxCategory':
      case 'appreciation':
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
  dataView: ReturnsDataView;
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
      mobile: ['Stock Rate', 'Bond Rate', 'Cash Rate', 'Inflation Rate'],
      desktop: ['Real Stock Rate', 'Real Bond Rate', 'Real Cash Rate', 'Inflation Rate'],
    },
    cagr: {
      mobile: ['Stock CAGR', 'Bond CAGR', 'Cash CAGR'],
      desktop: ['Real Stock CAGR', 'Real Bond CAGR', 'Real Cash CAGR'],
    },
    annualAmounts: {
      mobile: ['Stock Gain', 'Bond Gain', 'Cash Gain'],
      desktop: ['Annual Stock Gain', 'Annual Bond Gain', 'Annual Cash Gain'],
    },
    cumulativeAmounts: {
      mobile: ['Cumul. Stock', 'Cumul. Bond', 'Cumul. Cash'],
      desktop: ['Cumul. Stock Gain', 'Cumul. Bond Gain', 'Cumul. Cash Gain'],
    },
    taxCategory: {
      mobile: ['Taxable', 'Tax-Deferred', 'Tax-Free', 'Cash'],
      desktop: ['Taxable Gains', 'Tax-Deferred Gains', 'Tax-Free Gains', 'Cash Gains'],
    },
    custom: {
      mobile: ['Stock Gain', 'Bond Gain', 'Cash Gain'],
      desktop: ['Annual Stock Gain', 'Annual Bond Gain', 'Annual Cash Gain'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  let showReferenceLineAtZero = true;
  let formatter = undefined;
  let transformedChartData: { name: string; amount: number; color: string }[] = [];

  switch (dataView) {
    case 'rates': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      const [stockLabel, bondLabel, cashLabel, inflationLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.realStockReturnRate, color: 'var(--chart-2)' },
        { name: bondLabel, amount: item.realBondReturnRate, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.realCashReturnRate, color: 'var(--chart-4)' },
        { name: inflationLabel, amount: item.inflationRate, color: 'var(--chart-8)' },
      ]);
      break;
    }
    case 'cagr': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.realStockCagr, color: 'var(--chart-2)' },
        { name: bondLabel, amount: item.realBondCagr, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.realCashCagr, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'annualAmounts': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.annualStockGain, color: 'var(--chart-2)' },
        { name: bondLabel, amount: item.annualBondGain, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.annualCashGain, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'cumulativeAmounts': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: stockLabel, amount: item.cumulativeStockGain, color: 'var(--chart-2)' },
        { name: bondLabel, amount: item.cumulativeBondGain, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.cumulativeCashGain, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'taxCategory': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [taxableLabel, taxDeferredLabel, taxFreeLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: taxableLabel, amount: item.taxableGains, color: 'var(--chart-1)' },
        { name: taxDeferredLabel, amount: item.taxDeferredGains, color: 'var(--chart-2)' },
        { name: taxFreeLabel, amount: item.taxFreeGains, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.cashSavingsGains, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'appreciation': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Annual Appreciation', amount: item.annualAssetAppreciation, color: 'var(--chart-2)' },
        { name: 'Cumul. Appreciation', amount: item.cumulativeAssetAppreciation, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'custom': {
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      formatter = (value: number) => formatNumber(value, 1, '$');

      const perAccountData = chartData.flatMap(({ perAccountData }) => perAccountData).filter(({ id }) => id === customDataID);
      if (perAccountData.length > 0) {
        const [stockLabel, bondLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
        transformedChartData = perAccountData.flatMap(({ returnAmounts }) => [
          { name: stockLabel, amount: returnAmounts.stocks, color: 'var(--chart-2)' },
          { name: bondLabel, amount: returnAmounts.bonds, color: 'var(--chart-3)' },
          { name: cashLabel, amount: returnAmounts.cash, color: 'var(--chart-4)' },
        ]);
        break;
      }

      const perAssetData = chartData.flatMap(({ perAssetData }) => perAssetData).filter(({ id }) => id === customDataID);
      if (perAssetData.length > 0) {
        transformedChartData = perAssetData.map(({ name, appreciation }) => ({ name, amount: appreciation, color: 'var(--chart-2)' }));
        showReferenceLineAtZero = false;
        break;
      }

      break;
    }
  }

  if (transformedChartData.length === 0) {
    return <div className="flex h-72 w-full items-center justify-center sm:h-84 lg:h-96">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

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
          {showReferenceLineAtZero && <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />}
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
