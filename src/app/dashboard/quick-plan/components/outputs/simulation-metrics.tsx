'use client';

import { useTheme } from 'next-themes';

import { cn, formatNumber } from '@/lib/utils';
import type { KeyMetrics } from '@/lib/types/key-metrics';

import MetricsCard from './metrics-card';

interface SimulationMetricsProps {
  keyMetrics: KeyMetrics;
}

const formatMetrics = (keyMetrics: KeyMetrics) => {
  const {
    success,
    retirementAge,
    yearsToRetirement,
    bankruptcyAge,
    yearsToBankruptcy,
    portfolioAtRetirement,
    lifetimeTaxesAndPenalties,
    finalPortfolio,
    progressToRetirement,
  } = keyMetrics;

  const formatters = {
    success: (v: number) => (v >= 0.99 ? 'Yes!' : v <= 0.01 ? 'No' : `${formatNumber(v * 100, 1)}%`),
    retirementAge: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    yearsToRetirement: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    bankruptcyAge: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    yearsToBankruptcy: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    portfolioAtRetirement: (v: number | null) => (v !== null ? `${formatNumber(v, 2, '$')}` : 'N/A'),
    lifetimeTaxesAndPenalties: (v: number) => `${formatNumber(v, 2, '$')}`,
    finalPortfolio: (v: number) => `${formatNumber(v, 2, '$')}`,
    progressToRetirement: (v: number | null) => (v !== null ? `${formatNumber(v * 100, 1)}%` : 'N/A'),
  };

  return {
    successForDisplay: formatters.success(success),
    retirementAgeForDisplay: formatters.retirementAge(retirementAge),
    yearsToRetirementForDisplay: formatters.yearsToRetirement(yearsToRetirement),
    bankruptcyAgeForDisplay: formatters.bankruptcyAge(bankruptcyAge),
    yearsToBankruptcyForDisplay: formatters.yearsToBankruptcy(yearsToBankruptcy),
    portfolioAtRetirementForDisplay: formatters.portfolioAtRetirement(portfolioAtRetirement),
    lifetimeTaxesAndPenaltiesForDisplay: formatters.lifetimeTaxesAndPenalties(lifetimeTaxesAndPenalties),
    finalPortfolioForDisplay: formatters.finalPortfolio(finalPortfolio),
    progressToRetirementForDisplay: formatters.progressToRetirement(progressToRetirement),
  };
};

const getSuccessColor = (success: number): string => {
  if (success >= 0.8) return 'fill-green-500 dark:fill-green-400';
  if (success >= 0.6) return 'fill-blue-500 dark:fill-blue-400';
  if (success >= 0.4) return 'fill-yellow-500 dark:fill-yellow-400';
  if (success >= 0.2) return 'fill-orange-500 dark:fill-orange-400';
  return 'fill-red-500 dark:fill-red-400';
};

export default function SimulationMetrics({ keyMetrics }: SimulationMetricsProps) {
  const { resolvedTheme } = useTheme();
  const legendStrokeColor = resolvedTheme === 'dark' ? 'white' : 'black';

  const {
    successForDisplay,
    retirementAgeForDisplay,
    yearsToRetirementForDisplay,
    bankruptcyAgeForDisplay,
    yearsToBankruptcyForDisplay,
    portfolioAtRetirementForDisplay,
    lifetimeTaxesAndPenaltiesForDisplay,
    finalPortfolioForDisplay,
    progressToRetirementForDisplay,
  } = formatMetrics(keyMetrics);

  const successColor = getSuccessColor(keyMetrics.success);

  const successWidget = (
    <svg viewBox="0 0 6 6" aria-hidden="true" className={cn('inline size-6 shrink-0', successColor)}>
      <rect x={0.5} y={0.5} width={5} height={5} stroke={legendStrokeColor} strokeWidth={0.5} paintOrder="stroke" />
    </svg>
  );

  return (
    <dl className="grid grid-cols-2 grid-rows-4 gap-2 2xl:grid-cols-3 2xl:grid-rows-3">
      <MetricsCard name="Success" stat={successForDisplay} className="col-span-2 2xl:col-span-1" statWidget={successWidget} />
      <MetricsCard name="Progress to Retirement" stat={progressToRetirementForDisplay} />
      <MetricsCard name="Retirement Age" stat={retirementAgeForDisplay} statContext={` (in ${yearsToRetirementForDisplay} years)`} />
      <MetricsCard name="Bankruptcy Age" stat={bankruptcyAgeForDisplay} statContext={` (in ${yearsToBankruptcyForDisplay} years)`} />
      <MetricsCard name="Lifetime Taxes" stat={lifetimeTaxesAndPenaltiesForDisplay} className="col-span-1 2xl:col-span-2" />
      <MetricsCard name="Retirement Portfolio" stat={portfolioAtRetirementForDisplay} className="col-span-2" />
      <MetricsCard name="Final Portfolio" stat={finalPortfolioForDisplay} className="col-span-2 2xl:col-span-1" />
    </dl>
  );
}
