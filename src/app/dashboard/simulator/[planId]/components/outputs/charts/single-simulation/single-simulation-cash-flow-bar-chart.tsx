'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';
import type { IncomeData } from '@/lib/calc/incomes';

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

interface SingleSimulationCashFlowBarChartProps {
  age: number;
  dataView: 'surplusDeficit' | 'cashFlow' | 'incomes' | 'expenses' | 'custom' | 'savingsRate';
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  customDataID: string;
}

export default function SingleSimulationCashFlowBarChart({
  age,
  dataView,
  rawChartData,
  customDataID,
}: SingleSimulationCashFlowBarChartProps) {
  const { resolvedTheme } = useTheme();
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
      mobile: ['Income Tax', 'FICA Tax', 'Cap Gains Tax', 'NIIT', 'EW Penalty'],
      desktop: ['Income Tax', 'FICA Tax', 'Cap Gains Tax', 'NIIT', 'EW Penalties'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  let transformedChartData: { name: string; amount: number; color: string }[] = [];
  const formatter = (value: number) => formatNumber(value, 1, '$');
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
      const [incomeTaxLabel, ficaTaxLabel, capGainsTaxLabel, niitLabel, earlyWithdrawalPenaltiesLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );

      transformedChartData = chartData.flatMap(
        ({ perExpenseData, perAssetData, perDebtData, incomeTax, ficaTax, capGainsTax, niit, earlyWithdrawalPenalties }) => [
          ...perExpenseData.map(({ name, expense }) => ({ name, amount: expense, color: 'var(--chart-1)' })),
          { name: incomeTaxLabel, amount: incomeTax, color: 'var(--chart-2)' },
          { name: ficaTaxLabel, amount: ficaTax, color: 'var(--chart-2)' },
          { name: capGainsTaxLabel, amount: capGainsTax, color: 'var(--chart-2)' },
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
