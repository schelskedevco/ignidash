'use client';

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
  if (success >= 0.8) return 'bg-green-400 dark:bg-green-700';
  if (success >= 0.6) return 'bg-cyan-400 dark:bg-cyan-700';
  if (success >= 0.4) return 'bg-orange-300 dark:bg-orange-600';
  if (success >= 0.2) return 'bg-orange-400 dark:bg-orange-700';
  return 'bg-red-500 dark:bg-red-700';
};

export default function SimulationMetrics({ keyMetrics }: SimulationMetricsProps) {
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

  const progressToRetirement = keyMetrics.progressToRetirement;
  const progressWidget =
    progressToRetirement !== null ? (
      <div className="relative h-8 w-8">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary/20" strokeWidth="6" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className="stroke-primary"
            strokeWidth="6"
            strokeDasharray={`${progressToRetirement * 97.4} 97.4`}
            strokeLinecap="round"
          />
        </svg>
      </div>
    ) : null;

  return (
    <dl className="grid grid-cols-2 gap-2 2xl:grid-cols-3">
      <MetricsCard
        name="Success"
        stat={successForDisplay}
        className="col-span-2 2xl:col-span-1"
        statClassName={cn('ring-black dark:ring-white ring px-1 text-black dark:text-white', successColor)}
      />
      <MetricsCard name="Progress to Retirement" stat={progressToRetirementForDisplay} className="col-span-2" statWidget={progressWidget} />
      <MetricsCard
        name="Retirement Age"
        stat={retirementAgeForDisplay}
        statContext={yearsToRetirementForDisplay !== '∞' ? ` (in ${yearsToRetirementForDisplay} years)` : undefined}
      />
      <MetricsCard
        name="Bankruptcy Age"
        stat={bankruptcyAgeForDisplay}
        statContext={yearsToBankruptcyForDisplay !== '∞' ? ` (in ${yearsToBankruptcyForDisplay} years)` : undefined}
      />
      <MetricsCard name="Lifetime Taxes" stat={lifetimeTaxesAndPenaltiesForDisplay} className="hidden 2xl:block" />
      <MetricsCard name="Retirement Portfolio" stat={portfolioAtRetirementForDisplay} className="2xl:col-span-2" />
      <MetricsCard name="Final Portfolio" stat={finalPortfolioForDisplay} />
    </dl>
  );
}
