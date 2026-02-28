'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { SingleSimulationWithdrawalsChartDataPoint } from '@/lib/types/chart-data-points';
import type { WithdrawalsDataView } from '@/lib/types/chart-data-views';

import { CustomLabelListContent, getBarChartTickConfig, ChartEmptyState, BarChartContainer } from '../chart-primitives';

interface SingleSimulationWithdrawalsBarChartProps {
  age: number;
  dataView: WithdrawalsDataView;
  rawChartData: SingleSimulationWithdrawalsChartDataPoint[];
  customDataID: string;
}

export default function SingleSimulationWithdrawalsBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationWithdrawalsBarChartProps) {
  const { gridColor, foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    annualAmounts: {
      mobile: ['Stock Withdrawals', 'Bond Withdrawals', 'Cash Withdrawals'],
      desktop: ['Annual Stock Withdrawals', 'Annual Bond Withdrawals', 'Annual Cash Withdrawals'],
    },
    cumulativeAmounts: {
      mobile: ['Cumul. Stock', 'Cumul. Bond', 'Cumul. Cash'],
      desktop: ['Cumul. Stock Withdrawals', 'Cumul. Bond Withdrawals', 'Cumul. Cash Withdrawals'],
    },
    taxCategory: {
      mobile: ['Taxable', 'Tax-Deferred', 'Tax-Free', 'Cash'],
      desktop: ['Taxable Withdrawals', 'Tax-Deferred Withdrawals', 'Tax-Free Withdrawals', 'Cash Withdrawals'],
    },
    realizedGains: {
      mobile: ['Annual Gains', 'Cumul. Gains'],
      desktop: ['Annual Realized Gains', 'Cumul. Realized Gains'],
    },
    earlyWithdrawals: {
      mobile: ['Annual EWs', 'Cumul. EWs'],
      desktop: ['Annual Early Withdrawals', 'Cumul. Early Withdrawals'],
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
        { name: annualStockLabel, amount: item.annualStockWithdrawals, color: 'var(--chart-1)' },
        { name: annualBondLabel, amount: item.annualBondWithdrawals, color: 'var(--chart-2)' },
        { name: annualCashLabel, amount: item.annualCashWithdrawals, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'cumulativeAmounts': {
      const [cumulativeStockLabel, cumulativeBondLabel, cumulativeCashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: cumulativeStockLabel, amount: item.cumulativeStockWithdrawals, color: 'var(--chart-1)' },
        { name: cumulativeBondLabel, amount: item.cumulativeBondWithdrawals, color: 'var(--chart-2)' },
        { name: cumulativeCashLabel, amount: item.cumulativeCashWithdrawals, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'taxCategory': {
      const [taxableLabel, taxDeferredLabel, taxFreeLabel, cashLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: taxableLabel, amount: item.taxableWithdrawals, color: 'var(--chart-1)' },
        { name: taxDeferredLabel, amount: item.taxDeferredWithdrawals, color: 'var(--chart-2)' },
        { name: taxFreeLabel, amount: item.taxFreeWithdrawals, color: 'var(--chart-3)' },
        { name: cashLabel, amount: item.cashSavingsWithdrawals, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'realizedGains': {
      const [annualLabel, cumulativeLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualLabel, amount: item.annualRealizedGains, color: 'var(--chart-2)' },
        { name: cumulativeLabel, amount: item.cumulativeRealizedGains, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'requiredMinimumDistributions': {
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Annual RMDs', amount: item.annualRequiredMinimumDistributions, color: 'var(--chart-2)' },
        { name: 'Cumul. RMDs', amount: item.cumulativeRequiredMinimumDistributions, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'earlyWithdrawals': {
      const [annualLabel, cumulativeLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualLabel, amount: item.annualEarlyWithdrawals, color: 'var(--chart-2)' },
        { name: cumulativeLabel, amount: item.cumulativeEarlyWithdrawals, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'shortfall': {
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Annual Shortfall', amount: item.annualShortfall, color: 'var(--chart-2)' },
        { name: 'Outstanding Shortfall', amount: item.outstandingShortfall, color: 'var(--chart-4)' },
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
        .flatMap(({ name, withdrawals }) => [
          { name: `${name} — Stock Withdrawals`, amount: withdrawals.stocks, color: 'var(--chart-1)' },
          { name: `${name} — Bond Withdrawals`, amount: withdrawals.bonds, color: 'var(--chart-2)' },
          { name: `${name} — Cash Withdrawals`, amount: withdrawals.cash, color: 'var(--chart-3)' },
        ]);
      break;
    }
    case 'withdrawalRate':
      break;
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
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
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
