import type { AssetReturnRates, AssetYieldRates } from '../asset';
import type { PhaseData } from '../phase';

export interface ReturnsProviderData {
  returns: AssetReturnRates;
  yields: AssetYieldRates;
  inflationRate: number;
}

export interface ReturnsProvider {
  getReturns(phaseData: PhaseData | null): ReturnsProviderData;
}
