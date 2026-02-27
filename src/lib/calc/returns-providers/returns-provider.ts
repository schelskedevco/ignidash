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
  /** Real return rates as decimals (e.g. 0.07 = 7%) */
  returns: AssetReturnRates;
  /** Nominal yield rates as decimals (e.g. 0.03 = 3%) */
  yields: AssetYieldRates;
  /** Annual inflation rate as a decimal (e.g. 0.03 = 3%) */
  inflationRate: number;
}

/** Strategy interface for generating investment returns each simulation year */
export interface ReturnsProvider {
  getReturns(phaseData: PhaseData | null): ReturnsProviderData;
}
