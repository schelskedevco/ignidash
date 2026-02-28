/** Memoized debt payoff month estimate. */
import { useMemo } from 'react';
import { estimatePayoffMonths, type PayoffEstimateParams } from '@/lib/utils/payoff-estimator-utils';

export function usePayoffEstimate(params: PayoffEstimateParams | null): number | null {
  return useMemo(() => (params !== null ? estimatePayoffMonths(params) : null), [params]);
}
