import type { AssetReturnRates, AssetYieldRates } from '../asset';
import type { PhaseData } from '../phase';

export interface ReturnsWithMetadata<TExtras extends Record<string, unknown> = Record<string, unknown>> {
  returns: AssetReturnRates;
  yields: AssetYieldRates;
  inflationRate: number;
  metadata: {
    extras?: TExtras;
  };
}

export interface ReturnsProvider<TExtras extends Record<string, unknown> = Record<string, unknown>> {
  getReturns(phaseData: PhaseData | null): ReturnsWithMetadata<TExtras>;
}
