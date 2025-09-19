import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { ReturnsProvider, ReturnsWithMetadata } from './returns-provider';

export class FixedReturnsProvider implements ReturnsProvider {
  constructor(private inputs: QuickPlanInputs) {}

  getReturns(): ReturnsWithMetadata {
    const { stockReturn, bondReturn, cashReturn, inflationRate } = this.inputs.marketAssumptions;

    const realStockReturn = (1 + stockReturn / 100) / (1 + inflationRate / 100) - 1;
    const realBondReturn = (1 + bondReturn / 100) / (1 + inflationRate / 100) - 1;
    const realCashReturn = (1 + cashReturn / 100) / (1 + inflationRate / 100) - 1;

    return {
      returns: { stocks: realStockReturn, bonds: realBondReturn, cash: realCashReturn },
      metadata: { inflationRate },
    };
  }
}
