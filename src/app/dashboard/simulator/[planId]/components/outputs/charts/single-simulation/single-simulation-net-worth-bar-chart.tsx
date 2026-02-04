'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SingleSimulationNetWorthChartDataPoint } from '@/lib/types/chart-data-points';

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

interface SingleSimulationNetWorthBarChartProps {
  age: number;
  dataView: 'netPortfolioChange' | 'netAssetChange' | 'netDebtReduction' | 'netWorthChange';
  rawChartData: SingleSimulationNetWorthChartDataPoint[];
}

export default function SingleSimulationNetWorthBarChart({ age, dataView, rawChartData }: SingleSimulationNetWorthBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    netPortfolioChange: {
      mobile: ['Returns', 'Contributions', 'Withdrawals'],
      desktop: ['Annual Returns', 'Annual Contributions', 'Annual Withdrawals'],
    },
    netAssetChange: {
      mobile: ['Appreciation', 'Purchased Value', 'Sold Value'],
      desktop: ['Annual Asset Appreciation', 'Annual Purchased Asset Value', 'Annual Sold Asset Value'],
    },
    netDebtReduction: {
      mobile: ['Debt Paydown', 'Debt Payoff', 'Debt Incurred'],
      desktop: ['Annual Debt Paydown', 'Annual Debt Payoff', 'Annual Debt Incurred'],
    },
    netWorthChange: {
      mobile: ['Portfolio Change', 'Asset Change', 'Debt Reduction'],
      desktop: ['Net Portfolio Change', 'Net Asset Change', 'Net Debt Reduction'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  let transformedChartData: { name: string; amount: number; color: string }[] = [];
  const formatter = (value: number) => formatNumber(value, 1, '$');

  switch (dataView) {
    case 'netPortfolioChange': {
      const [returnsLabel, contributionsLabel, withdrawalsLabel] = getLabelsForScreenSize(dataView, isSmallScreen);

      transformedChartData = chartData.flatMap(({ annualReturns, annualContributions, annualWithdrawals }) => [
        { name: returnsLabel, amount: annualReturns, color: 'var(--chart-1)' },
        { name: contributionsLabel, amount: annualContributions, color: 'var(--chart-2)' },
        { name: withdrawalsLabel, amount: -annualWithdrawals, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'netAssetChange': {
      const [assetAppreciationLabel, purchasedAssetValueLabel, soldAssetValueLabel] = getLabelsForScreenSize(dataView, isSmallScreen);

      transformedChartData = chartData.flatMap(({ annualAssetAppreciation, annualPurchasedAssetValue, annualSoldAssetValue }) => [
        { name: assetAppreciationLabel, amount: annualAssetAppreciation, color: 'var(--chart-1)' },
        { name: purchasedAssetValueLabel, amount: annualPurchasedAssetValue, color: 'var(--chart-2)' },
        { name: soldAssetValueLabel, amount: -annualSoldAssetValue, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'netDebtReduction': {
      const [debtPaydownLabel, debtPayoffLabel, debtIncurredLabel] = getLabelsForScreenSize(dataView, isSmallScreen);

      transformedChartData = chartData.flatMap(({ annualDebtPaydown, annualDebtPayoff, annualDebtIncurred }) => [
        { name: debtPaydownLabel, amount: annualDebtPaydown, color: 'var(--chart-1)' },
        { name: debtPayoffLabel, amount: annualDebtPayoff, color: 'var(--chart-2)' },
        { name: debtIncurredLabel, amount: -annualDebtIncurred, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'netWorthChange': {
      const [portfolioChangeLabel, assetChangeLabel, debtReductionLabel] = getLabelsForScreenSize(dataView, isSmallScreen);

      transformedChartData = chartData.flatMap(({ netPortfolioChange, netAssetChange, netDebtReduction }) => [
        { name: portfolioChangeLabel, amount: netPortfolioChange, color: 'var(--chart-1)' },
        { name: assetChangeLabel, amount: netAssetChange, color: 'var(--chart-2)' },
        { name: debtReductionLabel, amount: netDebtReduction, color: 'var(--chart-3)' },
      ]);
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
          <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />
          <Bar dataKey="amount" maxBarSize={75} minPointSize={20} label={<CustomLabelListContent isSmallScreen={isSmallScreen} />}>
            {transformedChartData.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.color} fillOpacity={0.5} stroke={entry.color} strokeWidth={3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
