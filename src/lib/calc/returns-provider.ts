import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { AssetReturns } from './asset';

export interface ReturnsProvider {
  /**
   * Get the real returns for a specific year.
   * @param year The year for which to get the returns.
   * @returns The real asset returns for the specified year.
   */
  getReturns(year: number): AssetReturns;
}

export class FixedReturnProvider implements ReturnsProvider {
  constructor(private inputs: QuickPlanInputs) {}

  getReturns(_year: number): AssetReturns {
    const { stockReturn, bondReturn, cashReturn, inflationRate } = this.inputs.marketAssumptions;

    const realStockReturn = (1 + stockReturn / 100) / (1 + inflationRate / 100) - 1;
    const realBondReturn = (1 + bondReturn / 100) / (1 + inflationRate / 100) - 1;
    const realCashReturn = (1 + cashReturn / 100) / (1 + inflationRate / 100) - 1;

    return {
      stocks: realStockReturn,
      bonds: realBondReturn,
      cash: realCashReturn,
    };
  }
}
