import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

import { ReturnsProvider, type ReturnsProviderData } from './returns-provider';
import type { PhaseData } from '../phase';

export class FixedReturnsProvider implements ReturnsProvider {
  constructor(private inputs: SimulatorInputs) {}

  getReturns(phaseData: PhaseData | null): ReturnsProviderData {
    const { stockReturn, bondReturn, cashReturn, inflationRate, bondYield, stockYield } = this.inputs.marketAssumptions;

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
