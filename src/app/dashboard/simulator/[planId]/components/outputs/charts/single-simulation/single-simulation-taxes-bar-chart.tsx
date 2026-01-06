'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { IncomeTaxBracket } from '@/lib/calc/tax-data/income-tax-brackets';
import type { CapitalGainsTaxBracket } from '@/lib/calc/tax-data/capital-gains-tax-brackets';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';

function getTaxBrackets(chartData: SingleSimulationTaxesChartDataPoint[]): {
  incomeTaxBrackets: IncomeTaxBracket[] | null;
  capitalGainsTaxBrackets: CapitalGainsTaxBracket[] | null;
} {
  return {
    incomeTaxBrackets: chartData[0]?.incomeTaxBrackets ?? null,
    capitalGainsTaxBrackets: chartData[0]?.capitalGainsTaxBrackets ?? null,
  };
}

const renderTaxBracketReferenceLines = (
  taxBrackets: IncomeTaxBracket[] | CapitalGainsTaxBracket[],
  taxableIncome: number,
  foregroundColor: string,
  foregroundMutedColor: string
) => {
  const nextBracketIndex = taxBrackets.findIndex((bracket) => bracket.min > taxableIncome);
  const visibleBrackets = nextBracketIndex === -1 ? taxBrackets : taxBrackets.slice(0, nextBracketIndex + 1);

  return visibleBrackets.map((bracket, index) => (
    <ReferenceLine
      key={index}
      y={bracket.min}
      stroke={foregroundMutedColor}
      ifOverflow="extendDomain"
      label={{
        value: `${(bracket.rate * 100).toFixed(0)}% (${formatNumber(bracket.min, 1, '$')})`,
        position: index !== visibleBrackets.length - 1 ? 'insideBottomRight' : 'insideTopRight',
        fill: foregroundColor,
        fontWeight: '600',
      }}
    />
  ));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabelListContent = (props: any) => {
  const { x, y, width, height, offset, value, isSmallScreen, dataView } = props;
  if (!value || value === 0) {
    return null;
  }

  const formatValue = (
    value: number,
    mode:
      | 'marginalRates'
      | 'effectiveRates'
      | 'annualAmounts'
      | 'cumulativeAmounts'
      | 'taxableIncome'
      | 'adjustedGrossIncome'
      | 'investmentIncome'
      | 'retirementDistributions'
      | 'taxExemptIncome'
      | 'ordinaryIncome'
      | 'capGainsAndDividends'
      | 'earlyWithdrawalPenalties'
      | 'adjustmentsAndDeductions'
      | 'socialSecurityIncome'
      | 'socialSecurityTaxablePercentage'
  ) => {
    switch (mode) {
      case 'marginalRates':
      case 'effectiveRates':
      case 'socialSecurityTaxablePercentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'annualAmounts':
      case 'cumulativeAmounts':
      case 'taxableIncome':
      case 'adjustedGrossIncome':
      case 'investmentIncome':
      case 'retirementDistributions':
      case 'taxExemptIncome':
      case 'ordinaryIncome':
      case 'capGainsAndDividends':
      case 'earlyWithdrawalPenalties':
      case 'adjustmentsAndDeductions':
      case 'socialSecurityIncome':
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

interface SingleSimulationTaxesBarChartProps {
  age: number;
  dataView:
    | 'marginalRates'
    | 'effectiveRates'
    | 'annualAmounts'
    | 'cumulativeAmounts'
    | 'taxableIncome'
    | 'adjustedGrossIncome'
    | 'investmentIncome'
    | 'retirementDistributions'
    | 'taxExemptIncome'
    | 'ordinaryIncome'
    | 'capGainsAndDividends'
    | 'earlyWithdrawalPenalties'
    | 'adjustmentsAndDeductions'
    | 'socialSecurityIncome'
    | 'socialSecurityTaxablePercentage';
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  referenceLineMode: 'hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates' | null;
  startAge: number;
}

export default function SingleSimulationTaxesBarChart({
  age,
  dataView,
  rawChartData,
  referenceLineMode,
  startAge,
}: SingleSimulationTaxesBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isSmallScreen = useIsMobile();

  const labelConfig: Record<string, { mobile: string[]; desktop: string[] }> = {
    marginalRates: {
      mobile: ['Income Rate', 'Cap Gains Rate'],
      desktop: ['Top Marginal Income Tax Rate', 'Top Marginal Cap Gains Tax Rate'],
    },
    effectiveRates: {
      mobile: ['Income Rate', 'Cap Gains Rate'],
      desktop: ['Effective Income Tax Rate', 'Effective Cap Gains Tax Rate'],
    },
    annualAmounts: {
      mobile: ['Income Tax', 'FICA Tax', 'Cap Gains Tax', 'NIIT', 'EW Penalty'],
      desktop: ['Annual Income Tax', 'Annual FICA Tax', 'Annual Cap Gains Tax', 'Annual NIIT', 'Annual EW Penalties'],
    },
    cumulativeAmounts: {
      mobile: ['Cumul. Income Tax', 'Cumul. FICA Tax', 'Cumul. CG Tax', 'Cumul. NIIT', 'Cumul. EW Penalty'],
      desktop: ['Cumul. Income Tax', 'Cumul. FICA Tax', 'Cumul. Cap Gains Tax', 'Cumul. NIIT', 'Cumul. EW Penalties'],
    },
    retirementDistributions: {
      mobile: ['Tax-Deferred', 'Early Roth'],
      desktop: ['Tax-Deferred Withdrawals', 'Early Roth Earnings Withdrawals'],
    },
    ordinaryIncome: {
      mobile: ['Earned Income', 'Soc. Sec.', 'Interest Income', 'Retirement Dist.'],
      desktop: ['Earned Income', 'Social Security', 'Interest Income', 'Retirement Distributions'],
    },
    earlyWithdrawalPenalties: {
      mobile: ['Annual EW Penalty', 'Cumul. EW Penalty'],
      desktop: ['Annual EW Penalties', 'Cumul. EW Penalties'],
    },
    adjustmentsAndDeductions: {
      mobile: ['Deductible Contrib.', 'CL Deduction', 'Std. Deduction'],
      desktop: ['Tax-Deductible Contributions', 'Capital Loss Deduction', 'Standard Deduction'],
    },
    socialSecurityIncome: {
      mobile: ['Soc. Sec.', 'Taxable Soc. Sec.'],
      desktop: ['Social Security', 'Taxable Social Security'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartData = rawChartData.filter((item) => item.age === age);

  const { incomeTaxBrackets, capitalGainsTaxBrackets } = getTaxBrackets(chartData);
  const taxableIncome = Math.max(...chartData.map((item) => item.taxableIncome));

  let transformedChartData: { name: string; amount: number; color: string }[] = [];
  let formatter = undefined;

  let stackId: string | undefined = undefined;
  const stackOffset: 'sign' | undefined = undefined;

  switch (dataView) {
    case 'marginalRates': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      const [incomeTaxLabel, capGainsTaxLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, amount: item.topMarginalIncomeTaxRate, color: 'var(--chart-2)' },
        { name: capGainsTaxLabel, amount: item.topMarginalCapGainsTaxRate, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'effectiveRates': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      const [incomeTaxLabel, capGainsTaxLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, amount: item.effectiveIncomeTaxRate, color: 'var(--chart-2)' },
        { name: capGainsTaxLabel, amount: item.effectiveCapGainsTaxRate, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'annualAmounts': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [incomeTaxLabel, ficaTaxLabel, capGainsTaxLabel, niitLabel, earlyWithdrawalPenaltiesLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, amount: item.annualIncomeTax, color: 'var(--chart-1)' },
        { name: ficaTaxLabel, amount: item.annualFicaTax, color: 'var(--chart-2)' },
        { name: capGainsTaxLabel, amount: item.annualCapGainsTax, color: 'var(--chart-3)' },
        { name: niitLabel, amount: item.annualNiit, color: 'var(--chart-4)' },
        { name: earlyWithdrawalPenaltiesLabel, amount: item.annualEarlyWithdrawalPenalties, color: 'var(--chart-5)' },
      ]);
      break;
    }
    case 'cumulativeAmounts': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [incomeTaxLabel, ficaTaxLabel, capGainsTaxLabel, niitLabel, earlyWithdrawalPenaltiesLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, amount: item.cumulativeIncomeTax, color: 'var(--chart-1)' },
        { name: ficaTaxLabel, amount: item.cumulativeFicaTax, color: 'var(--chart-2)' },
        { name: capGainsTaxLabel, amount: item.cumulativeCapGainsTax, color: 'var(--chart-3)' },
        { name: niitLabel, amount: item.cumulativeNiit, color: 'var(--chart-4)' },
        { name: earlyWithdrawalPenaltiesLabel, amount: item.cumulativeEarlyWithdrawalPenalties, color: 'var(--chart-5)' },
      ]);
      break;
    }
    case 'taxableIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Taxable Ordinary Income', amount: item.taxableOrdinaryIncome, color: 'var(--chart-1)' },
        { name: 'Taxable Cap Gains', amount: item.taxableCapGains, color: 'var(--chart-2)' },
      ]);

      stackId = 'stack';
      break;
    }
    case 'adjustedGrossIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Adjusted Gross Income', amount: item.adjustedGrossIncome, color: 'var(--chart-1)' },
      ]);

      break;
    }
    case 'investmentIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Interest Income', amount: item.interestIncome, color: 'var(--chart-1)' },
        { name: 'Dividend Income', amount: item.dividendIncome, color: 'var(--chart-2)' },
      ]);
      break;
    }
    case 'retirementDistributions': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [taxDeferredWithdrawalsLabel, earlyRothWithdrawalsLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: taxDeferredWithdrawalsLabel, amount: item.taxDeferredWithdrawals, color: 'var(--chart-1)' },
        { name: earlyRothWithdrawalsLabel, amount: item.earlyRothEarningsWithdrawals, color: 'var(--chart-2)' },
      ]);
      break;
    }
    case 'taxExemptIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Tax-Exempt Income', amount: item.taxExemptIncome, color: 'var(--chart-2)' },
      ]);
      break;
    }
    case 'ordinaryIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [earnedIncomeLabel, socialSecurityIncomeLabel, interestIncomeLabel, retirementDistributionsLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );
      transformedChartData = chartData.flatMap((item) => [
        { name: earnedIncomeLabel, amount: item.earnedIncome, color: 'var(--chart-1)' },
        { name: socialSecurityIncomeLabel, amount: item.socialSecurityIncome, color: 'var(--chart-2)' },
        { name: interestIncomeLabel, amount: item.interestIncome, color: 'var(--chart-3)' },
        { name: retirementDistributionsLabel, amount: item.retirementDistributions, color: 'var(--chart-4)' },
      ]);
      break;
    }
    case 'capGainsAndDividends': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Realized Gains', amount: item.realizedGains, color: 'var(--chart-1)' },
        { name: 'Dividend Income', amount: item.dividendIncome, color: 'var(--chart-2)' },
      ]);
      break;
    }
    case 'earlyWithdrawalPenalties': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [annualPenaltiesLabel, cumulativePenaltiesLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualPenaltiesLabel, amount: item.annualEarlyWithdrawalPenalties, color: 'var(--chart-1)' },
        { name: cumulativePenaltiesLabel, amount: item.cumulativeEarlyWithdrawalPenalties, color: 'var(--chart-2)' },
      ]);
      break;
    }
    case 'adjustmentsAndDeductions': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [taxDeductibleContributionsLabel, capLossDeductionLabel, standardDeductionLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );
      transformedChartData = chartData.flatMap((item) => [
        { name: taxDeductibleContributionsLabel, amount: item.taxDeductibleContributions, color: 'var(--chart-1)' },
        { name: capLossDeductionLabel, amount: item.capitalLossDeduction, color: 'var(--chart-2)' },
        { name: standardDeductionLabel, amount: item.standardDeduction, color: 'var(--chart-3)' },
      ]);
      break;
    }
    case 'socialSecurityIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [socialSecurityLabel, taxableSocialSecurityLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: socialSecurityLabel, amount: item.socialSecurityIncome, color: 'var(--chart-1)' },
        { name: taxableSocialSecurityLabel, amount: item.taxableSocialSecurityIncome, color: 'var(--chart-2)' },
      ]);
      break;
    }
    case 'socialSecurityTaxablePercentage': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Max Taxable %', amount: item.maxTaxablePercentage, color: 'var(--chart-2)' },
        { name: 'Actual Taxable %', amount: item.actualTaxablePercentage, color: 'var(--chart-4)' },
      ]);
      break;
    }
  }

  transformedChartData = transformedChartData.filter((item) => item.amount !== 0).sort((a, b) => b.amount - a.amount);
  if (transformedChartData.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
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
          stackOffset={stackOffset}
          margin={{ top: 0, right: 10, left: 10, bottom: bottomMargin }}
          tabIndex={-1}
        >
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
          <Bar
            dataKey="amount"
            maxBarSize={60}
            minPointSize={20}
            stackId={stackId}
            label={<CustomLabelListContent isSmallScreen={isSmallScreen} dataView={dataView} />}
          >
            {transformedChartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.5} stroke={entry.color} strokeWidth={3} />
            ))}
          </Bar>
          {referenceLineMode === 'marginalIncomeTaxRates' &&
            incomeTaxBrackets &&
            renderTaxBracketReferenceLines(incomeTaxBrackets, taxableIncome, foregroundColor, foregroundMutedColor)}
          {referenceLineMode === 'marginalCapGainsTaxRates' &&
            capitalGainsTaxBrackets &&
            renderTaxBracketReferenceLines(capitalGainsTaxBrackets, taxableIncome, foregroundColor, foregroundMutedColor)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
