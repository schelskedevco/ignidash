'use client';

import { BarChart, ReferenceLine, ResponsiveContainer } from 'recharts';

import { formatCompactCurrency } from '@/lib/utils/currency-formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChartTheme } from '@/hooks/use-chart-theme';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';
import type { CashFlowDataView } from '@/lib/types/chart-data-views';
import type { IncomeData } from '@/lib/calc/incomes';

import {
  getBarChartTickConfig,
  ChartEmptyState,
  BarChartContainer,
  ChartGrid,
  BarChartXAxis,
  BarChartYAxis,
  StandardBar,
} from '../chart-primitives';

interface SingleSimulationCashFlowBarChartProps {
  age: number;
  dataView: CashFlowDataView;
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  customDataID: string;
}

export default function SingleSimulationCashFlowBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationCashFlowBarChartProps) {
  const { foregroundColor, foregroundMutedColor } = useChartTheme();
  const isSmallScreen = useIsMobile();

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    surplusDeficit: {
      mobile: ['Earned', 'Soc. Sec.', 'Tax-Free', 'Expenses', 'Taxes', 'Debt'],
      desktop: ['Earned Income', 'Social Security', 'Tax-Free Income', 'Expenses', 'Taxes & Penalties', 'Debt Payments'],
    },
    cashFlow: {
      mobile: ['Earned', 'Soc. Sec.', 'Tax-Free', 'Liquidated', 'Proceeds', 'Expenses', 'Taxes', 'Debt', 'Invested', 'Outlay'],
      desktop: [
        'Earned Income',
        'Social Security',
        'Tax-Free Income',
        'Amount Liquidated',
        'Asset Sale Proceeds',
        'Expenses',
        'Taxes & Penalties',
        'Debt Payments',
        'Amount Invested',
        'Asset Purchase Outlay',
      ],
    },
    incomes: {
      mobile: ['Match'],
      desktop: ['Employer Match'],
    },
    expenses: {
      mobile: ['Fed. Income Tax', 'FICA Tax', 'Cap Gains Tax', 'NIIT', 'EW Penalty'],
      desktop: ['Fed. Income Tax', 'FICA Tax', 'Cap Gains Tax', 'NIIT', 'EW Penalties'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  let transformedChartData: { name: string; amount: number; color: string }[] = [];
  const formatter = (value: number) => formatCompactCurrency(value, 1);
  let showReferenceLineAtZero = false;

  switch (dataView) {
    case 'surplusDeficit': {
      const [earnedIncomeLabel, socialSecurityIncomeLabel, taxFreeIncomeLabel, expensesLabel, taxesAndPenaltiesLabel, debtPaymentsLabel] =
        getLabelsForScreenSize(dataView, isSmallScreen);

      transformedChartData = chartData.flatMap(
        ({ earnedIncome, socialSecurityIncome, taxFreeIncome, expenses, taxesAndPenalties, debtPayments }) => [
          { name: earnedIncomeLabel, amount: earnedIncome, color: 'var(--chart-1)' },
          { name: socialSecurityIncomeLabel, amount: socialSecurityIncome, color: 'var(--chart-1)' },
          { name: taxFreeIncomeLabel, amount: taxFreeIncome, color: 'var(--chart-1)' },
          { name: expensesLabel, amount: -expenses, color: 'var(--chart-2)' },
          { name: taxesAndPenaltiesLabel, amount: -taxesAndPenalties, color: 'var(--chart-3)' },
          { name: debtPaymentsLabel, amount: -debtPayments, color: 'var(--chart-4)' },
        ]
      );

      showReferenceLineAtZero = true;
      break;
    }
    case 'cashFlow': {
      const [
        earnedIncomeLabel,
        socialSecurityIncomeLabel,
        taxFreeIncomeLabel,
        amountLiquidatedLabel,
        assetSaleProceedsLabel,
        expensesLabel,
        taxesAndPenaltiesLabel,
        debtPaymentsLabel,
        amountInvestedLabel,
        assetPurchaseOutlayLabel,
      ] = getLabelsForScreenSize(dataView, isSmallScreen);

      transformedChartData = chartData.flatMap(
        ({
          earnedIncome,
          socialSecurityIncome,
          taxFreeIncome,
          amountLiquidated,
          assetSaleProceeds,
          expenses,
          taxesAndPenalties,
          debtPayments,
          amountInvested,
          assetPurchaseOutlay,
        }) => [
          { name: earnedIncomeLabel, amount: earnedIncome, color: 'var(--chart-1)' },
          { name: socialSecurityIncomeLabel, amount: socialSecurityIncome, color: 'var(--chart-1)' },
          { name: taxFreeIncomeLabel, amount: taxFreeIncome, color: 'var(--chart-1)' },
          { name: amountLiquidatedLabel, amount: amountLiquidated, color: 'var(--chart-2)' },
          { name: assetSaleProceedsLabel, amount: assetSaleProceeds, color: 'var(--chart-3)' },
          { name: expensesLabel, amount: -expenses, color: 'var(--chart-4)' },
          { name: taxesAndPenaltiesLabel, amount: -taxesAndPenalties, color: 'var(--chart-5)' },
          { name: debtPaymentsLabel, amount: -debtPayments, color: 'var(--chart-6)' },
          { name: amountInvestedLabel, amount: -amountInvested, color: 'var(--chart-7)' },
          { name: assetPurchaseOutlayLabel, amount: -assetPurchaseOutlay, color: 'var(--chart-8)' },
        ]
      );

      showReferenceLineAtZero = true;
      break;
    }
    case 'incomes': {
      const getIncomeColor = (income: IncomeData) => {
        if (income.socialSecurityIncome > 0) return 'var(--chart-2)';
        if (income.taxFreeIncome > 0) return 'var(--chart-3)';
        return 'var(--chart-1)';
      };

      const [employerMatchLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap(({ perIncomeData, employerMatch }) => [
        ...perIncomeData.map((income) => ({ name: income.name, amount: income.income, color: getIncomeColor(income) })),
        { name: employerMatchLabel, amount: employerMatch, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'expenses': {
      const [incomeTaxLabel, ficaTaxLabel, capitalGainsTaxLabel, niitLabel, earlyWithdrawalPenaltiesLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );

      transformedChartData = chartData.flatMap(
        ({ perExpenseData, perAssetData, perDebtData, federalIncomeTax, ficaTax, capitalGainsTax, niit, earlyWithdrawalPenalties }) => [
          ...perExpenseData.map(({ name, expense }) => ({ name, amount: expense, color: 'var(--chart-1)' })),
          { name: incomeTaxLabel, amount: federalIncomeTax, color: 'var(--chart-2)' },
          { name: ficaTaxLabel, amount: ficaTax, color: 'var(--chart-2)' },
          { name: capitalGainsTaxLabel, amount: capitalGainsTax, color: 'var(--chart-2)' },
          { name: niitLabel, amount: niit, color: 'var(--chart-2)' },
          { name: earlyWithdrawalPenaltiesLabel, amount: earlyWithdrawalPenalties, color: 'var(--chart-2)' },
          ...perAssetData.map(({ name, loanPayment }) => ({ name, amount: loanPayment, color: 'var(--chart-3)' })),
          ...perDebtData.map(({ name, payment }) => ({ name, amount: payment, color: 'var(--chart-3)' })),
        ]
      );
      break;
    }
    case 'custom': {
      if (!customDataID) {
        console.warn('Custom data name is required for custom data view');
        break;
      }

      const perIncomeData = chartData.flatMap(({ perIncomeData }) => perIncomeData).filter(({ id }) => id === customDataID);
      if (perIncomeData.length > 0) {
        transformedChartData = perIncomeData.map(({ name, income }) => ({ name, amount: income, color: 'var(--chart-2)' }));
        break;
      }

      const perExpenseData = chartData.flatMap(({ perExpenseData }) => perExpenseData).filter(({ id }) => id === customDataID);
      if (perExpenseData.length > 0) {
        transformedChartData = perExpenseData.map(({ name, expense }) => ({ name, amount: expense, color: 'var(--chart-4)' }));
        break;
      }

      const perAssetData = chartData.flatMap(({ perAssetData }) => perAssetData).filter(({ id }) => id === customDataID);
      if (perAssetData.length > 0) {
        transformedChartData = perAssetData.map(({ name, loanPayment }) => ({ name, amount: loanPayment, color: 'var(--chart-8)' }));
        break;
      }

      const perDebtData = chartData.flatMap(({ perDebtData }) => perDebtData).filter(({ id }) => id === customDataID);
      if (perDebtData.length > 0) {
        transformedChartData = perDebtData.map(({ name, payment }) => ({ name, amount: payment, color: 'var(--chart-5)' }));
        break;
      }

      break;
    }
    case 'savingsRate': {
      break;
    }
  }

  transformedChartData = transformedChartData.filter((item) => item.amount !== 0);
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
          {showReferenceLineAtZero && <ReferenceLine y={0} stroke={foregroundColor} strokeWidth={1} ifOverflow="extendDomain" />}
          <StandardBar data={transformedChartData} />
        </BarChart>
      </ResponsiveContainer>
    </BarChartContainer>
  );
}
