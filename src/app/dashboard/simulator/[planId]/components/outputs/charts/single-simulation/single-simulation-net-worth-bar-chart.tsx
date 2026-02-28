'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { SingleSimulationNetWorthChartDataPoint } from '@/lib/types/chart-data-points';

import { CustomLabelListContent, getBarChartTickConfig, ChartEmptyState, BarChartContainer } from '../chart-primitives';

interface SingleSimulationNetWorthBarChartProps {
  age: number;
  dataView: 'netPortfolioChange' | 'netAssetChange' | 'netDebtReduction' | 'netWorthChange';
  rawChartData: SingleSimulationNetWorthChartDataPoint[];
}

export default function SingleSimulationNetWorthBarChart({ age, dataView, rawChartData }: SingleSimulationNetWorthBarChartProps) {
  const { gridColor, foregroundColor, foregroundMutedColor } = useChartTheme();
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
  const formatter = (value: number) => formatCompactCurrency(value, 1);

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
    return <ChartEmptyState />;
  }

  const { tick, bottomMargin } = getBarChartTickConfig(transformedChartData.length, isSmallScreen, foregroundMutedColor);

  return (
    <BarChartContainer>
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
    </BarChartContainer>
  );
}
