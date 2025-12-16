'use client';

import { useEffect } from 'react';
import { PartyPopperIcon, UmbrellaIcon, TriangleAlertIcon, BanknoteXIcon, LandmarkIcon, SunsetIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { keyMetricsForDisplay } from '@/lib/utils/data-display-formatters';
import { useUpdateCachedKeyMetrics } from '@/lib/stores/simulator-store';

import MetricsCard from './metrics-card';

interface SimulationMetricsProps {
  keyMetrics: KeyMetrics;
}

const getSuccessColor = (success: number): string => {
  if (success >= 0.8)
    return 'bg-green-100 text-green-800 inset-ring inset-ring-green-700/75 dark:bg-green-300/10 dark:text-green-200 dark:inset-ring-green-400/75';
  if (success >= 0.6)
    return 'bg-blue-100 text-blue-800 inset-ring inset-ring-blue-700/75 dark:bg-blue-300/10 dark:text-blue-200 dark:inset-ring-blue-400/75';
  if (success >= 0.4)
    return 'bg-yellow-100 text-yellow-800 inset-ring inset-ring-yellow-700/75 dark:bg-yellow-300/10 dark:text-yellow-200 dark:inset-ring-yellow-400/75';
  if (success >= 0.2)
    return 'bg-pink-100 text-pink-800 inset-ring inset-ring-pink-700/75 dark:bg-pink-300/10 dark:text-pink-200 dark:inset-ring-pink-400/75';
  return 'bg-red-100 text-red-800 inset-ring inset-ring-red-700/75 dark:bg-red-300/10 dark:text-red-200 dark:inset-ring-red-400/75';
};

export default function SimulationMetrics({ keyMetrics }: SimulationMetricsProps) {
  const updateCachedKeyMetrics = useUpdateCachedKeyMetrics();

  useEffect(() => {
    updateCachedKeyMetrics(keyMetrics);
    return () => updateCachedKeyMetrics(null);
  }, [keyMetrics, updateCachedKeyMetrics]);

  const {
    successForDisplay,
    retirementAgeForDisplay,
    bankruptcyAgeForDisplay,
    portfolioAtRetirementForDisplay,
    lifetimeTaxesAndPenaltiesForDisplay,
    finalPortfolioForDisplay,
    progressToRetirementForDisplay,
  } = keyMetricsForDisplay(keyMetrics);

  const successColor = getSuccessColor(keyMetrics.success);

  const progressToRetirement = keyMetrics.progressToRetirement;
  const progressWidget =
    progressToRetirement !== null ? (
      <div className="relative h-10 w-10">
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

  const metricName = (name: string) => (keyMetrics.areValuesMeans ? `Mean ${name}` : name);

  return (
    <div className="grid grid-cols-2 gap-2 2xl:grid-cols-3">
      <MetricsCard
        name="Success"
        stat={successForDisplay}
        className="col-span-2 2xl:col-span-1"
        statClassName={cn('px-1', successColor)}
        statWidget={<PartyPopperIcon className="text-primary h-10 w-10" />}
      />
      <MetricsCard
        name={metricName('Progress to Retirement')}
        stat={progressToRetirementForDisplay}
        className="col-span-2"
        statWidget={progressWidget}
      />
      <MetricsCard
        name={metricName('Retirement Age')}
        stat={retirementAgeForDisplay}
        statWidget={<UmbrellaIcon className="text-primary h-10 w-10" />}
      />
      <MetricsCard
        name={metricName('Bankruptcy Age')}
        stat={bankruptcyAgeForDisplay}
        statWidget={<TriangleAlertIcon className="text-primary h-10 w-10" />}
      />
      <MetricsCard
        name={metricName('Lifetime Taxes')}
        stat={lifetimeTaxesAndPenaltiesForDisplay}
        className="hidden 2xl:block"
        statWidget={<BanknoteXIcon className="text-primary h-10 w-10" />}
      />
      <MetricsCard
        name={metricName('Retirement Portfolio')}
        stat={portfolioAtRetirementForDisplay}
        className="2xl:col-span-2"
        statWidget={<LandmarkIcon className="text-primary h-10 w-10" />}
      />
      <MetricsCard
        name={metricName('Final Portfolio')}
        stat={finalPortfolioForDisplay}
        statWidget={<SunsetIcon className="text-primary h-10 w-10" />}
      />
    </div>
  );
}
