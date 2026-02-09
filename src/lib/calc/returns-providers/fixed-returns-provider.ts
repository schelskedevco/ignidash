/**
 * Fixed returns provider for deterministic simulations
 *
 * Returns the same user-specified rates every year, converted from nominal to real.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

import { ReturnsProvider, type ReturnsProviderData } from './returns-provider';
import type { PhaseData } from '../phase';

/** Returns constant real returns derived from user-specified nominal rates */
export class FixedReturnsProvider implements ReturnsProvider {
  constructor(private inputs: SimulatorInputs) {}

  /**
   * Produces fixed real returns for a simulation year
   * @param phaseData - Current simulation phase (unused for fixed returns)
   * @returns Constant real returns, nominal yields, and inflation rate
   */
  getReturns(phaseData: PhaseData | null): ReturnsProviderData {
    const { stockReturn, bondReturn, cashReturn, inflationRate, bondYield, stockYield } = this.inputs.marketAssumptions;

    // Fisher equation: realReturn = (1 + nominal) / (1 + inflation) - 1
    const realStockReturn = (1 + stockReturn / 100) / (1 + inflationRate / 100) - 1;
    const realBondReturn = (1 + bondReturn / 100) / (1 + inflationRate / 100) - 1;
    const realCashReturn = (1 + cashReturn / 100) / (1 + inflationRate / 100) - 1;

    return {
      returns: { stocks: realStockReturn, bonds: realBondReturn, cash: realCashReturn },
      yields: { stocks: stockYield, bonds: bondYield, cash: cashReturn },
      inflationRate,
    };
  }
}
