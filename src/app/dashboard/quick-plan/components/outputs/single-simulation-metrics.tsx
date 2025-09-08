'use client';

import { formatNumber } from '@/lib/utils';
import type { FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';

import MetricsCard from './metrics-card';

interface SingleSimulationMetricsProps {
  keyMetrics: FixedReturnsKeyMetricsV2;
}

export default function SingleSimulationMetrics({ keyMetrics }: SingleSimulationMetricsProps) {
  const { finalPortfolio, portfolioAtRetirement, retirementAge, yearsToRetirement, progressToRetirement } = keyMetrics;

  const progressToRetirementForDisplay = progressToRetirement !== null ? `${formatNumber(progressToRetirement * 100, 0)}%` : 'N/A';
  const retirementAgeForDisplay = retirementAge !== null ? `${formatNumber(retirementAge, 0)}` : '∞';
  const yearsToRetirementForDisplay = yearsToRetirement !== null ? `${formatNumber(yearsToRetirement, 0)}` : '∞';
  const portfolioAtRetirementForDisplay = portfolioAtRetirement !== null ? `$${formatNumber(portfolioAtRetirement, 2)}` : 'N/A';
  const finalPortfolioForDisplay = `$${formatNumber(finalPortfolio, 2)}`;

  return (
    <dl className="my-4 grid grid-cols-2 gap-2 2xl:grid-cols-3">
      <MetricsCard name="Success" stat={'Yes!'} />
      <MetricsCard name="Progress to Retirement" stat={progressToRetirementForDisplay} />
      <MetricsCard
        name="Retirement Age"
        stat={retirementAgeForDisplay}
        statContext={` (in ${yearsToRetirementForDisplay} years)`}
        className="sm:col-span-2 2xl:col-span-1"
      />
      <MetricsCard name="Required Portfolio" stat={portfolioAtRetirementForDisplay} className="2xl:col-span-2" />
      <MetricsCard name="Final Portfolio" stat={finalPortfolioForDisplay} className="col-span-2 sm:col-span-1" />
    </dl>
  );
}
