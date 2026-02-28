'use client';

import { BarChart, ResponsiveContainer } from 'recharts';

import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { SingleSimulationContributionsChartDataPoint } from '@/lib/types/chart-data-points';
import type { ContributionsDataView } from '@/lib/types/chart-data-views';

import {
  getBarChartTickConfig,
  ChartEmptyState,
  BarChartContainer,
  ChartGrid,
  BarChartXAxis,
  BarChartYAxis,
  StandardBar,
} from '../chart-primitives';

interface SingleSimulationContributionsBarChartProps {
  age: number;
  dataView: ContributionsDataView;
  rawChartData: SingleSimulationContributionsChartDataPoint[];
  customDataID: string;
}

export default function SingleSimulationContributionsBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationContributionsBarChartProps) {
  const { foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    annualAmounts: {
      mobile: ['Stock Contrib.', 'Bond Contrib.', 'Cash Contrib.'],
      desktop: ['Annual Stock Contrib.', 'Annual Bond Contrib.', 'Annual Cash Contrib.'],
    },
    cumulativeAmounts: {
      mobile: ['Cumul. Stock', 'Cumul. Bond', 'Cumul. Cash'],
      desktop: ['Cumul. Stock Contrib.', 'Cumul. Bond Contrib.', 'Cumul. Cash Contrib.'],
    },
    taxCategory: {
      mobile: ['Taxable', 'Tax-Deferred', 'Tax-Free', 'Cash'],
      desktop: ['Taxable Contrib.', 'Tax-Deferred Contrib.', 'Tax-Free Contrib.', 'Cash Contrib.'],
    },
    employerMatch: {
      mobile: ['Annual Match', 'Cumul. Match'],
      desktop: ['Annual Employer Match', 'Cumul. Employer Match'],
    },
    shortfall: {
      mobile: ['Shortfall Repaid', 'Outstanding Shortfall'],
      desktop: ['Annual Shortfall Repaid', 'Outstanding Shortfall'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  const formatter = (value: number) => formatCompactCurrency(value, 1);
  let transformedChartData: { name: string; amount: number; color: string }[] = [];

  switch (dataView) {
    case 'annualAmounts': {
      const [annualStockLabel, annualBondLabel, annualCashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualStockLabel, amount: item.annualStockContributions, color: 'var(--chart-1)' },
        { name: annualBondLabel, amount: item.annualBondContributions, color: 'var(--chart-2)' },
        { name: annualCashLabel, amount: item.annualCashContributions, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'cumulativeAmounts': {
      const [cumulativeStockLabel, cumulativeBondLabel, cumulativeCashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: cumulativeStockLabel, amount: item.cumulativeStockContributions, color: 'var(--chart-1)' },
        { name: cumulativeBondLabel, amount: item.cumulativeBondContributions, color: 'var(--chart-2)' },
        { name: cumulativeCashLabel, amount: item.cumulativeCashContributions, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'taxCategory': {
      const [taxableLabel, taxDeferredLabel, taxFreeLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: taxableLabel, amount: item.taxableContributions, color: 'var(--chart-1)' },
        { name: taxDeferredLabel, amount: item.taxDeferredContributions, color: 'var(--chart-2)' },
        { name: taxFreeLabel, amount: item.taxFreeContributions, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.cashSavingsContributions, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'employerMatch': {
      const [annualMatchLabel, cumulativeMatchLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualMatchLabel, amount: item.annualEmployerMatch, color: 'var(--chart-2)' },
        { name: cumulativeMatchLabel, amount: item.cumulativeEmployerMatch, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'shortfall': {
      const [shortfallRepaidLabel, outstandingShortfallLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: shortfallRepaidLabel, amount: item.annualShortfallRepaid, color: 'var(--chart-2)' },
        { name: outstandingShortfallLabel, amount: item.outstandingShortfall, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'custom': {
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      transformedChartData = chartData
        .flatMap(({ perAccountData }) => perAccountData)
        .filter(({ id }) => id === customDataID)
        .flatMap(({ name, contributions }) => [
          { name: `${name} — Stock Contrib.`, amount: contributions.stocks, color: 'var(--chart-1)' },
          { name: `${name} — Bond Contrib.`, amount: contributions.bonds, color: 'var(--chart-2)' },
          { name: `${name} — Cash Contrib.`, amount: contributions.cash, color: 'var(--chart-3)' },
        ]);
      break;
    }
  }

  transformedChartData = transformedChartData.sort((a, b) => b.amount - a.amount);
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
          <ChartGrid />
          <BarChartXAxis tick={tick} />
          <BarChartYAxis formatter={formatter} />
          <StandardBar data={transformedChartData} />
        </BarChart>
      </ResponsiveContainer>
    </BarChartContainer>
  );
}
