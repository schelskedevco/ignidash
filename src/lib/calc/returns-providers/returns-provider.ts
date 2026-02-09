/**
 * Returns provider interface for the simulation engine
 *
 * Defines the contract that all return generation strategies (fixed, stochastic,
 * historical backtest) must implement.
 */

import type { AssetReturnRates, AssetYieldRates } from '../asset';
import type { PhaseData } from '../phase';

/** Output from a returns provider for a single simulation year */
export interface ReturnsProviderData {
  returns: AssetReturnRates;
  yields: AssetYieldRates;
  inflationRate: number;
}

/** Strategy interface for generating investment returns each simulation year */
export interface ReturnsProvider {
  getReturns(phaseData: PhaseData | null): ReturnsProviderData;
}
