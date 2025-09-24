'use client';

import { formatNumber } from '@/lib/utils';
import type { KeyMetrics } from '@/lib/types/key-metrics';

import MetricsCard from './metrics-card';

interface SimulationMetricsProps {
  keyMetrics: KeyMetrics;
}

const formatMetrics = (keyMetrics: KeyMetrics) => {
  const { success, retirementAge, yearsToRetirement, portfolioAtRetirement, finalPortfolio, progressToRetirement } = keyMetrics;

  const formatters = {
    success: (v: number) => (v >= 0.99 ? 'Yes!' : v <= 0.01 ? 'No' : `${formatNumber(v * 100, 1)}%`),
    progressToRetirement: (v: number | null) => (v !== null ? `${formatNumber(v * 100, 1)}%` : 'N/A'),
    retirementAge: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    yearsToRetirement: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    portfolioAtRetirement: (v: number | null) => (v !== null ? `${formatNumber(v, 2, '$')}` : 'N/A'),
    finalPortfolio: (v: number) => `${formatNumber(v, 2, '$')}`,
  };

  return {
    successForDisplay: formatters.success(success),
    progressToRetirementForDisplay: formatters.progressToRetirement(progressToRetirement),
    retirementAgeForDisplay: formatters.retirementAge(retirementAge),
    yearsToRetirementForDisplay: formatters.yearsToRetirement(yearsToRetirement),
    portfolioAtRetirementForDisplay: formatters.portfolioAtRetirement(portfolioAtRetirement),
    finalPortfolioForDisplay: formatters.finalPortfolio(finalPortfolio),
  };
};

export default function SimulationMetrics({ keyMetrics }: SimulationMetricsProps) {
  const {
    successForDisplay,
    progressToRetirementForDisplay,
    retirementAgeForDisplay,
    yearsToRetirementForDisplay,
    portfolioAtRetirementForDisplay,
    finalPortfolioForDisplay,
  } = formatMetrics(keyMetrics);

  return (
    <dl className="grid grid-cols-2 gap-2 2xl:grid-cols-3">
      <MetricsCard name="Success" stat={successForDisplay} />
      <MetricsCard name="Progress to Retirement" stat={progressToRetirementForDisplay} />
      <MetricsCard
        name="Retirement Age"
        stat={retirementAgeForDisplay}
        statContext={` (in ${yearsToRetirementForDisplay} years)`}
        className="sm:col-span-2 2xl:col-span-1"
      />
      <MetricsCard name="Retirement Portfolio" stat={portfolioAtRetirementForDisplay} className="2xl:col-span-2" />
      <MetricsCard name="Final Portfolio" stat={finalPortfolioForDisplay} className="col-span-2 sm:col-span-1" />
    </dl>
  );
}
