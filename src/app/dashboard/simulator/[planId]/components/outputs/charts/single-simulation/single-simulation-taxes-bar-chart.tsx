'use client';

import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine, LabelList } from 'recharts';

import { formatNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { IncomeTaxBracket } from '@/lib/calc/tax-data/income-tax-brackets';
import type { CapitalGainsTaxBracket } from '@/lib/calc/tax-data/capital-gains-tax-brackets';
import { NIIT_RATE } from '@/lib/calc/tax-data/niit-thresholds';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';

const getTaxBrackets = (
  chartData: SingleSimulationTaxesChartDataPoint[]
): {
  incomeTaxBrackets: IncomeTaxBracket[] | null;
  capitalGainsTaxBrackets: CapitalGainsTaxBracket[] | null;
} => ({
  incomeTaxBrackets: chartData[0]?.incomeTaxBrackets ?? null,
  capitalGainsTaxBrackets: chartData[0]?.capitalGainsTaxBrackets ?? null,
});

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

const getNiitThreshold = (chartData: SingleSimulationTaxesChartDataPoint[]): number | null => {
  return chartData[0]?.niitThreshold ?? null;
};

const renderNiitThresholdReferenceLine = (niitThreshold: number, foregroundColor: string, foregroundMutedColor: string) => {
  return (
    <ReferenceLine
      y={niitThreshold}
      stroke={foregroundMutedColor}
      ifOverflow="extendDomain"
      label={{
        value: `${(NIIT_RATE * 100).toFixed(1)}% (${formatNumber(niitThreshold, 1, '$')})`,
        position: 'insideTopRight',
        fill: foregroundColor,
        fontWeight: '600',
      }}
    />
  );
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
      | 'nonTaxableIncome'
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
      case 'nonTaxableIncome':
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

type BarChartData = {
  name: string;
  segments: Array<{ amount: number; color: string }>;
};

const normalizeChartData = (data: BarChartData[]) => {
  const maxSegments = Math.max(...data.map((d) => d.segments.length), 0);
  return {
    maxSegments,
    normalizedData: data.map((item) => ({
      ...item,
      segments: Array.from({ length: maxSegments }, (_, i) => item.segments[i] ?? { amount: 0, color: 'none' }),
    })),
  };
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
    | 'nonTaxableIncome'
    | 'ordinaryIncome'
    | 'capGainsAndDividends'
    | 'earlyWithdrawalPenalties'
    | 'adjustmentsAndDeductions'
    | 'socialSecurityIncome'
    | 'socialSecurityTaxablePercentage';
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  referenceLineMode: 'hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates' | null;
  agiReferenceLineMode: 'hideReferenceLines' | 'niitThreshold' | null;
}

export default function SingleSimulationTaxesBarChart({
  age,
  dataView,
  rawChartData,
  referenceLineMode,
  agiReferenceLineMode,
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
  const niitThreshold = getNiitThreshold(chartData);
  const taxableIncome = Math.max(...chartData.map((item) => item.taxableIncome));

  let formatter = undefined;
  let transformedChartData: BarChartData[] = [];

  let filterZeroValues = true;
  let stackId: string | undefined = undefined;

  switch (dataView) {
    case 'marginalRates': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      filterZeroValues = false;

      const [incomeTaxLabel, capGainsTaxLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, segments: [{ amount: item.topMarginalIncomeTaxRate, color: 'var(--chart-2)' }] },
        { name: capGainsTaxLabel, segments: [{ amount: item.topMarginalCapGainsTaxRate, color: 'var(--chart-4)' }] },
      ]);
      break;
    }
    case 'effectiveRates': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      filterZeroValues = false;

      const [incomeTaxLabel, capGainsTaxLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, segments: [{ amount: item.effectiveIncomeTaxRate, color: 'var(--chart-2)' }] },
        { name: capGainsTaxLabel, segments: [{ amount: item.effectiveCapGainsTaxRate, color: 'var(--chart-4)' }] },
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
        { name: incomeTaxLabel, segments: [{ amount: item.annualIncomeTax, color: 'var(--chart-1)' }] },
        { name: ficaTaxLabel, segments: [{ amount: item.annualFicaTax, color: 'var(--chart-2)' }] },
        { name: capGainsTaxLabel, segments: [{ amount: item.annualCapGainsTax, color: 'var(--chart-3)' }] },
        { name: niitLabel, segments: [{ amount: item.annualNiit, color: 'var(--chart-4)' }] },
        { name: earlyWithdrawalPenaltiesLabel, segments: [{ amount: item.annualEarlyWithdrawalPenalties, color: 'var(--chart-5)' }] },
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
        { name: incomeTaxLabel, segments: [{ amount: item.cumulativeIncomeTax, color: 'var(--chart-1)' }] },
        { name: ficaTaxLabel, segments: [{ amount: item.cumulativeFicaTax, color: 'var(--chart-2)' }] },
        { name: capGainsTaxLabel, segments: [{ amount: item.cumulativeCapGainsTax, color: 'var(--chart-3)' }] },
        { name: niitLabel, segments: [{ amount: item.cumulativeNiit, color: 'var(--chart-4)' }] },
        { name: earlyWithdrawalPenaltiesLabel, segments: [{ amount: item.cumulativeEarlyWithdrawalPenalties, color: 'var(--chart-5)' }] },
      ]);
      break;
    }
    case 'taxableIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');
      stackId = 'stack';

      transformedChartData = chartData.flatMap((item) => [
        {
          name: 'Taxable Income',
          segments: [
            { amount: item.taxableIncomeTaxedAsOrdinary, color: 'var(--chart-1)' },
            { amount: item.taxableIncomeTaxedAsCapGains, color: 'var(--chart-2)' },
          ],
        },
      ]);
      break;
    }
    case 'adjustedGrossIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');
      stackId = 'stack';

      transformedChartData = chartData.flatMap((item) => [
        {
          name: 'Adjusted Gross Income',
          segments: [
            { amount: item.adjustedIncomeTaxedAsOrdinary, color: 'var(--chart-1)' },
            { amount: item.adjustedIncomeTaxedAsCapGains, color: 'var(--chart-2)' },
          ],
        },
      ]);
      break;
    }
    case 'investmentIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Interest Income', segments: [{ amount: item.taxableInterestIncome, color: 'var(--chart-1)' }] },
        { name: 'Dividend Income', segments: [{ amount: item.taxableDividendIncome, color: 'var(--chart-2)' }] },
        { name: 'Realized Gains', segments: [{ amount: item.realizedGains, color: 'var(--chart-3)' }] },
      ]);
      break;
    }
    case 'retirementDistributions': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      const [taxDeferredWithdrawalsLabel, earlyRothWithdrawalsLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: taxDeferredWithdrawalsLabel, segments: [{ amount: item.taxDeferredWithdrawals, color: 'var(--chart-1)' }] },
        { name: earlyRothWithdrawalsLabel, segments: [{ amount: item.earlyRothEarningsWithdrawals, color: 'var(--chart-2)' }] },
      ]);
      break;
    }
    case 'nonTaxableIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Non-Taxable Income', segments: [{ amount: item.nonTaxableIncome, color: 'var(--chart-2)' }] },
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
        { name: earnedIncomeLabel, segments: [{ amount: item.earnedIncome, color: 'var(--chart-1)' }] },
        { name: socialSecurityIncomeLabel, segments: [{ amount: item.socialSecurityIncome, color: 'var(--chart-2)' }] },
        { name: interestIncomeLabel, segments: [{ amount: item.taxableInterestIncome, color: 'var(--chart-3)' }] },
        { name: retirementDistributionsLabel, segments: [{ amount: item.taxableRetirementDistributions, color: 'var(--chart-4)' }] },
      ]);
      break;
    }
    case 'capGainsAndDividends': {
      formatter = (value: number) => formatNumber(value, 1, '$');

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Realized Gains', segments: [{ amount: item.realizedGains, color: 'var(--chart-1)' }] },
        { name: 'Dividend Income', segments: [{ amount: item.taxableDividendIncome, color: 'var(--chart-2)' }] },
      ]);
      break;
    }
    case 'earlyWithdrawalPenalties': {
      formatter = (value: number) => formatNumber(value, 1, '$');
      filterZeroValues = false;

      const [annualPenaltiesLabel, cumulativePenaltiesLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualPenaltiesLabel, segments: [{ amount: item.annualEarlyWithdrawalPenalties, color: 'var(--chart-2)' }] },
        { name: cumulativePenaltiesLabel, segments: [{ amount: item.cumulativeEarlyWithdrawalPenalties, color: 'var(--chart-4)' }] },
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
        { name: taxDeductibleContributionsLabel, segments: [{ amount: item.taxDeductibleContributions, color: 'var(--chart-1)' }] },
        { name: capLossDeductionLabel, segments: [{ amount: item.capitalLossDeduction, color: 'var(--chart-2)' }] },
        { name: standardDeductionLabel, segments: [{ amount: item.standardDeduction, color: 'var(--chart-3)' }] },
      ]);
      break;
    }
    case 'socialSecurityIncome': {
      formatter = (value: number) => formatNumber(value, 1, '$');
      filterZeroValues = false;

      const [socialSecurityLabel, taxableSocialSecurityLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: socialSecurityLabel, segments: [{ amount: item.socialSecurityIncome, color: 'var(--chart-1)' }] },
        { name: taxableSocialSecurityLabel, segments: [{ amount: item.taxableSocialSecurityIncome, color: 'var(--chart-2)' }] },
      ]);
      break;
    }
    case 'socialSecurityTaxablePercentage': {
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      filterZeroValues = false;

      transformedChartData = chartData.flatMap((item) => [
        { name: 'Max Taxable %', segments: [{ amount: item.maxTaxablePercentage, color: 'var(--chart-2)' }] },
        { name: 'Actual Taxable %', segments: [{ amount: item.actualTaxablePercentage, color: 'var(--chart-4)' }] },
      ]);
      break;
    }
  }

  const getTotalAmount = (item: BarChartData) => item.segments.reduce((acc, s) => acc + s.amount, 0);
  transformedChartData = transformedChartData
    .filter((item) => (filterZeroValues ? getTotalAmount(item) !== 0 : true))
    .sort((a, b) => getTotalAmount(b) - getTotalAmount(a));
  if (transformedChartData.length === 0) {
    return <div className="flex h-72 w-full items-center justify-center sm:h-84 lg:h-96">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1'; // stone-700 : stone-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917'; // stone-100 : stone-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e'; // stone-300 : stone-600

  const shouldUseCustomTick = transformedChartData.length > 3 || (isSmallScreen && transformedChartData.length > 1);
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 100 : 25;

  const { maxSegments, normalizedData } = normalizeChartData(transformedChartData);
  const getDataKey = (segmentIndex: number) => `segments[${segmentIndex}].amount`;

  return (
    <div className="h-full min-h-72 w-full sm:min-h-84 lg:min-h-96 [&_g:focus]:outline-none [&_svg:focus]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={normalizedData} className="text-xs" margin={{ top: 5, right: 10, left: 10, bottom: bottomMargin }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="5 5" stroke={gridColor} vertical={false} />
          <XAxis tick={tick} axisLine={false} dataKey="name" interval={0} />
          <YAxis tick={{ fill: foregroundMutedColor }} axisLine={false} tickLine={false} hide={isSmallScreen} tickFormatter={formatter} />
          {Array.from({ length: maxSegments }).map((_, segmentIndex) => (
            <Bar key={segmentIndex} dataKey={getDataKey(segmentIndex)} maxBarSize={75} minPointSize={20} stackId={stackId}>
              {normalizedData.map((entry, i) => {
                const segment = entry.segments[segmentIndex];

                const color = segment?.color;
                const amount = segment?.amount;

                const fillOpacity = filterZeroValues ? (amount !== 0 ? 0.5 : 0) : 0.5;
                const strokeWidth = filterZeroValues ? (amount !== 0 ? 3 : 0) : 3;

                return <Cell key={i} fill={color} fillOpacity={fillOpacity} stroke={color} strokeWidth={strokeWidth} />;
              })}
              <LabelList
                dataKey={getDataKey(segmentIndex)}
                position="middle"
                content={<CustomLabelListContent isSmallScreen={isSmallScreen} dataView={dataView} />}
              />
            </Bar>
          ))}
          {referenceLineMode === 'marginalIncomeTaxRates' &&
            incomeTaxBrackets &&
            renderTaxBracketReferenceLines(incomeTaxBrackets, taxableIncome, foregroundColor, foregroundMutedColor)}
          {referenceLineMode === 'marginalCapGainsTaxRates' &&
            capitalGainsTaxBrackets &&
            renderTaxBracketReferenceLines(capitalGainsTaxBrackets, taxableIncome, foregroundColor, foregroundMutedColor)}
          {agiReferenceLineMode === 'niitThreshold' &&
            niitThreshold &&
            renderNiitThresholdReferenceLine(niitThreshold, foregroundColor, foregroundMutedColor)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
