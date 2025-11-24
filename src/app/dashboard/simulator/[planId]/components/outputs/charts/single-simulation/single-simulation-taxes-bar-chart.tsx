'use client';

import { useTheme } from 'next-themes';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell, ReferenceLine, Tooltip } from 'recharts';

import { formatNumber, formatChartString, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClickDetection } from '@/hooks/use-outside-click';
import type { IncomeTaxBracket } from '@/lib/calc/tax-data/income-tax-brackets';
import type { CapitalGainsTaxBracket } from '@/lib/calc/tax-data/capital-gains-tax-brackets';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';
import { Divider } from '@/components/catalyst/divider';

type IncomeCalculationsTooltipPayload = {
  name: string;
  taxableOrdinaryIncome: number;
  taxableCapGains: number;
  grossIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
  adjustments: Record<string, number>;
  deductions: Record<string, number>;
};

interface IncomeCalculationsTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: keyof IncomeCalculationsTooltipPayload;
    payload: IncomeCalculationsTooltipPayload;
  }>;
  label?: number;
  startAge: number;
  age: number;
  disabled: boolean;
  dataView: 'taxableIncome' | 'adjustedGrossIncome';
}

function getTaxBrackets(chartData: SingleSimulationTaxesChartDataPoint[]): {
  incomeTaxBrackets: IncomeTaxBracket[] | null;
  capitalGainsTaxBrackets: CapitalGainsTaxBracket[] | null;
} {
  return {
    incomeTaxBrackets: chartData[0]?.incomeTaxBrackets ?? null,
    capitalGainsTaxBrackets: chartData[0]?.capitalGainsTaxBrackets ?? null,
  };
}

const IncomeCalculationsTooltip = ({ active, payload, startAge, age, disabled, dataView }: IncomeCalculationsTooltipProps) => {
  if (!(active && payload && payload.length) || disabled) return null;

  const currentYear = new Date().getFullYear();
  const yearForAge = currentYear + (age - startAge);

  const needsBgTextColor = ['var(--chart-3)', 'var(--chart-4)'];

  const entry = payload[0].payload;

  const grossIncome = (
    <p className="flex justify-between text-sm font-semibold">
      <span className="mr-2">Gross Income:</span>
      <span className="ml-1 font-semibold">{formatNumber(entry.grossIncome, 1, '$')}</span>
    </p>
  );

  const adjustments = Object.entries(entry.adjustments).map(([name, value]) => (
    <p key={name} className="flex justify-between text-sm font-semibold">
      <span className="mr-2">{`${formatChartString(name)}:`}</span>
      <span className="ml-1 font-semibold">{formatNumber(value, 1, '$')}</span>
    </p>
  ));

  const deductions = Object.entries(entry.deductions).map(([name, value]) => (
    <p key={name} className="flex justify-between text-sm font-semibold">
      <span className="mr-2">{`${formatChartString(name)}:`}</span>
      <span className="ml-1 font-semibold">{formatNumber(value, 1, '$')}</span>
    </p>
  ));

  switch (dataView) {
    case 'taxableIncome': {
      const header = (
        <div className="mx-1 mb-2 flex flex-col gap-2">
          {grossIncome}
          <Divider />
          <p className="text-muted-foreground -mb-2 text-xs/6">Adjustments</p>
          {adjustments}
          <Divider />
          <p className="text-muted-foreground -mb-2 text-xs/6">Deductions</p>
          {deductions}
          <Divider />
        </div>
      );

      return (
        <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
          <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
            <span>Age {age}</span>
            <span className="text-muted-foreground">{yearForAge}</span>
          </p>
          {header}
          <div className="flex flex-col gap-2">
            {payload.map((entry) => (
              <p
                key={entry.dataKey}
                style={{ backgroundColor: entry.color }}
                className={cn('border-foreground/50 flex justify-between rounded-lg border px-2 text-sm', {
                  'text-background': needsBgTextColor.includes(entry.color),
                })}
              >
                <span className="mr-2">{`${formatChartString(entry.dataKey)}:`}</span>
                <span className="ml-1 font-semibold">{formatNumber(entry.value, 1, '$')}</span>
              </p>
            ))}
            <p
              style={{ backgroundColor: 'var(--chart-3)' }}
              className={`border-foreground/50 text-background flex justify-between rounded-lg border px-2 text-sm`}
            >
              <span className="mr-2">{`${formatChartString('taxableIncome')}:`}</span>
              <span className="ml-1 font-semibold">{formatNumber(entry.taxableIncome, 1, '$')}</span>
            </p>
          </div>
        </div>
      );
    }
    case 'adjustedGrossIncome': {
      const header = (
        <div className="mx-1 mb-2 flex flex-col gap-2">
          {grossIncome}
          <Divider />
          <p className="text-muted-foreground -mb-2 text-xs/6">Adjustments</p>
          {adjustments}
          <Divider />
        </div>
      );

      return (
        <div className="text-foreground bg-background rounded-lg border p-2 shadow-md">
          <p className="mx-1 mb-2 flex justify-between text-sm font-semibold">
            <span>Age {age}</span>
            <span className="text-muted-foreground">{yearForAge}</span>
          </p>
          {header}
          <div className="flex flex-col gap-2">
            <p
              style={{ backgroundColor: 'var(--chart-2)' }}
              className={`border-foreground/50 flex justify-between rounded-lg border px-2 text-sm`}
            >
              <span className="mr-2">{`${formatChartString('adjustedGrossIncome')}:`}</span>
              <span className="ml-1 font-semibold">{formatNumber(entry.adjustedGrossIncome, 1, '$')}</span>
            </p>
          </div>
        </div>
      );
    }
  }
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
  ) => {
    switch (mode) {
      case 'marginalRates':
      case 'effectiveRates':
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

const COLORS = ['var(--chart-2)', 'var(--chart-4)', 'var(--chart-3)', 'var(--chart-1)'];

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
    | 'adjustmentsAndDeductions';
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
  const [clickedOutsideChart, setClickedOutsideChart] = useState(false);

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
      mobile: ['Income Tax', 'FICA Tax', 'Cap Gains Tax', 'EW Penalty'],
      desktop: ['Annual Income Tax', 'Annual FICA Tax', 'Annual Cap Gains Tax', 'Annual EW Penalties'],
    },
    cumulativeAmounts: {
      mobile: ['Cumul. Income Tax', 'Cumul. FICA Tax', 'Cumul. CG Tax', 'Cumul. EW Penalty'],
      desktop: ['Cumul. Income Tax', 'Cumul. FICA Tax', 'Cumul. Cap Gains Tax', 'Cumul. EW Penalties'],
    },
    retirementDistributions: {
      mobile: ['Tax-Deferred', 'Early Roth'],
      desktop: ['Tax-Deferred Withdrawals', 'Early Roth Earnings Withdrawals'],
    },
    ordinaryIncome: {
      mobile: ['Earned Income', 'Interest Income', 'Retirement Dist.'],
      desktop: ['Earned Income', 'Interest Income', 'Retirement Distributions'],
    },
    earlyWithdrawalPenalties: {
      mobile: ['Annual EW Penalty', 'Cumul. EW Penalty'],
      desktop: ['Annual EW Penalties', 'Cumul. EW Penalties'],
    },
    adjustmentsAndDeductions: {
      mobile: ['Tax-Deferred', 'CL Deduction', 'Std. Deduction'],
      desktop: ['Tax-Deferred Contributions', 'Capital Loss Deduction', 'Standard Deduction'],
    },
  };

  const getLabelsForScreenSize = (dataView: keyof typeof labelConfig, isSmallScreen: boolean) => {
    return labelConfig[dataView][isSmallScreen ? 'mobile' : 'desktop'];
  };

  const chartRef = useClickDetection<HTMLDivElement>(
    () => setClickedOutsideChart(true),
    () => setClickedOutsideChart(false)
  );

  const chartData = rawChartData.filter((item) => item.age === age);
  const { incomeTaxBrackets, capitalGainsTaxBrackets } = getTaxBrackets(chartData);

  let formatter = undefined;
  let transformedChartData: { name: string; [key: string]: number | string | Record<string, number> }[] = [];
  let dataKeys: string[] = ['amount'];

  let isStacked = false;
  const stackedColors: string[] = [];

  switch (dataView) {
    case 'marginalRates': {
      const [incomeTaxLabel, capGainsTaxLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, amount: item.topMarginalIncomeTaxRate },
        { name: capGainsTaxLabel, amount: item.topMarginalCapGainsTaxRate },
      ]);
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      break;
    }
    case 'effectiveRates': {
      const [incomeTaxLabel, capGainsTaxLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, amount: item.effectiveIncomeTaxRate },
        { name: capGainsTaxLabel, amount: item.effectiveCapGainsTaxRate },
      ]);
      formatter = (value: number) => `${(value * 100).toFixed(1)}%`;
      break;
    }
    case 'annualAmounts': {
      const [incomeTaxLabel, ficaTaxLabel, capGainsTaxLabel, earlyWithdrawalPenaltiesLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, amount: item.annualIncomeTax },
        { name: ficaTaxLabel, amount: item.annualFicaTax },
        { name: capGainsTaxLabel, amount: item.annualCapGainsTax },
        { name: earlyWithdrawalPenaltiesLabel, amount: item.annualEarlyWithdrawalPenalties },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
    case 'cumulativeAmounts': {
      const [incomeTaxLabel, ficaTaxLabel, capGainsTaxLabel, earlyWithdrawalPenaltiesLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );
      transformedChartData = chartData.flatMap((item) => [
        { name: incomeTaxLabel, amount: item.cumulativeIncomeTax },
        { name: ficaTaxLabel, amount: item.cumulativeFicaTax },
        { name: capGainsTaxLabel, amount: item.cumulativeCapGainsTax },
        { name: earlyWithdrawalPenaltiesLabel, amount: item.cumulativeEarlyWithdrawalPenalties },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
    case 'taxableIncome':
      let hasOrdinaryIncome = false;
      let hasCapGains = false;

      transformedChartData = chartData.map((item) => {
        hasOrdinaryIncome = item.taxableOrdinaryIncome > 0 || hasOrdinaryIncome;
        hasCapGains = item.taxableCapGains > 0 || hasCapGains;

        return {
          name: 'Taxable Income',
          taxableOrdinaryIncome: item.taxableOrdinaryIncome,
          taxableCapGains: item.taxableCapGains,
          grossIncome: item.grossIncome,
          adjustedGrossIncome: item.adjustedGrossIncome,
          taxableIncome: item.taxableIncome,
          adjustments: item.adjustments,
          deductions: item.deductions,
        };
      });

      dataKeys = [];
      if (hasOrdinaryIncome) {
        dataKeys.push('taxableOrdinaryIncome');
        stackedColors.push(COLORS[0]);
      }

      if (hasCapGains) {
        dataKeys.push('taxableCapGains');
        stackedColors.push(COLORS[1]);
      }

      formatter = (value: number) => formatNumber(value, 1, '$');
      isStacked = true;
      break;
    case 'adjustedGrossIncome':
      transformedChartData = chartData.map((item) => ({
        name: 'AGI',
        taxableOrdinaryIncome: item.taxableOrdinaryIncome,
        taxableCapGains: item.taxableCapGains,
        grossIncome: item.grossIncome,
        adjustedGrossIncome: item.adjustedGrossIncome,
        taxableIncome: item.taxableIncome,
        adjustments: item.adjustments,
        deductions: item.deductions,
      }));

      dataKeys = ['adjustedGrossIncome'];
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'investmentIncome':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Interest Income', amount: item.interestIncome },
        { name: 'Dividend Income', amount: item.dividendIncome },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'retirementDistributions': {
      const [taxDeferredWithdrawalsLabel, earlyRothWithdrawalsLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: taxDeferredWithdrawalsLabel, amount: item.taxDeferredWithdrawals },
        { name: earlyRothWithdrawalsLabel, amount: item.earlyRothEarningsWithdrawals },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
    case 'taxExemptIncome':
      transformedChartData = chartData.flatMap((item) => [{ name: 'Tax-Exempt Income', amount: item.taxExemptIncome }]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'ordinaryIncome': {
      const [earnedIncomeLabel, interestIncomeLabel, retirementDistributionsLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: earnedIncomeLabel, amount: item.earnedIncome },
        { name: interestIncomeLabel, amount: item.interestIncome },
        { name: retirementDistributionsLabel, amount: item.retirementDistributions },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
    case 'capGainsAndDividends':
      transformedChartData = chartData.flatMap((item) => [
        { name: 'Realized Gains', amount: item.realizedGains },
        { name: 'Dividend Income', amount: item.dividendIncome },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    case 'earlyWithdrawalPenalties': {
      const [annualPenaltiesLabel, cumulativePenaltiesLabel] = getLabelsForScreenSize(dataView, isSmallScreen);
      transformedChartData = chartData.flatMap((item) => [
        { name: annualPenaltiesLabel, amount: item.annualEarlyWithdrawalPenalties },
        { name: cumulativePenaltiesLabel, amount: item.cumulativeEarlyWithdrawalPenalties },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
    case 'adjustmentsAndDeductions': {
      const [taxDeferredContributionsLabel, capLossDeductionLabel, standardDeductionLabel] = getLabelsForScreenSize(
        dataView,
        isSmallScreen
      );
      transformedChartData = chartData.flatMap((item) => [
        { name: taxDeferredContributionsLabel, amount: item.taxDeferredContributions },
        { name: capLossDeductionLabel, amount: item.capitalLossDeduction },
        { name: standardDeductionLabel, amount: item.standardDeduction },
      ]);
      formatter = (value: number) => formatNumber(value, 1, '$');
      break;
    }
  }

  if (transformedChartData.length === 0 || dataKeys.length === 0) {
    return <div className="flex h-64 w-full items-center justify-center sm:h-72 lg:h-80">No data available for the selected view.</div>;
  }

  const gridColor = resolvedTheme === 'dark' ? '#3f3f46' : '#d4d4d8'; // zinc-700 : zinc-300
  const foregroundColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#18181b'; // zinc-100 : zinc-900
  const foregroundMutedColor = resolvedTheme === 'dark' ? '#d4d4d8' : '#52525b'; // zinc-300 : zinc-600

  const shouldUseCustomTick = transformedChartData.length > 3 || (isSmallScreen && transformedChartData.length > 1);
  const tick = shouldUseCustomTick ? CustomizedAxisTick : { fill: foregroundMutedColor };
  const bottomMargin = shouldUseCustomTick ? 100 : 25;

  return (
    <div ref={chartRef} className="h-full min-h-64 w-full sm:min-h-72 lg:min-h-80 [&_svg:focus]:outline-none">
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
          {!isStacked &&
            dataKeys.map((dataKey, idx) => (
              <Bar key={`${dataKey}-${idx}`} dataKey={dataKey} maxBarSize={250} minPointSize={20}>
                {transformedChartData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={3}
                    fillOpacity={0.5}
                  />
                ))}
                <LabelList
                  dataKey={dataKey}
                  position="middle"
                  content={<CustomLabelListContent isSmallScreen={isSmallScreen} dataView={dataView} />}
                />
              </Bar>
            ))}
          {isStacked &&
            dataKeys.map((dataKey, idx) => (
              <Bar
                key={`${dataKey}-${idx}`}
                dataKey={dataKey}
                stackId="stack"
                maxBarSize={250}
                minPointSize={20}
                fill={stackedColors[idx]}
                stroke={stackedColors[idx]}
                strokeWidth={3}
                fillOpacity={0.5}
              >
                <LabelList
                  dataKey={dataKey}
                  position="middle"
                  content={<CustomLabelListContent isSmallScreen={isSmallScreen} dataView={dataView} />}
                />
              </Bar>
            ))}
          {(dataView === 'taxableIncome' || dataView === 'adjustedGrossIncome') && (
            <Tooltip
              content={
                <IncomeCalculationsTooltip
                  startAge={startAge}
                  age={age}
                  disabled={isSmallScreen && clickedOutsideChart}
                  dataView={dataView}
                />
              }
              cursor={false}
            />
          )}
          {referenceLineMode === 'marginalIncomeTaxRates' &&
            incomeTaxBrackets &&
            incomeTaxBrackets.map((bracket, index) => (
              <ReferenceLine
                key={index}
                y={bracket.min}
                stroke={foregroundMutedColor}
                label={{
                  value: `${(bracket.rate * 100).toFixed(0)}% (${formatNumber(bracket.min, 1, '$')})`,
                  position: 'insideBottomRight',
                  fill: foregroundColor,
                  fontWeight: '600',
                }}
              />
            ))}
          {referenceLineMode === 'marginalCapGainsTaxRates' &&
            capitalGainsTaxBrackets &&
            capitalGainsTaxBrackets.map((bracket, index) => (
              <ReferenceLine
                key={index}
                y={bracket.min}
                stroke={foregroundMutedColor}
                label={{
                  value: `${(bracket.rate * 100).toFixed(0)}% (${formatNumber(bracket.min, 1, '$')})`,
                  position: 'insideBottomRight',
                  fill: foregroundColor,
                  fontWeight: '600',
                }}
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
