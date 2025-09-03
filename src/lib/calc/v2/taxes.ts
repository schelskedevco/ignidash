import { SimulationState } from './simulation-engine';

import { IncomesData } from './incomes';

export interface TaxesData {
  incomeTaxRate: number;
  incomeTaxAmount: number;
  netIncome: number;
}

export class TaxProcessor {
  constructor(private simulationState: SimulationState) {}

  process(incomesData: IncomesData): TaxesData {
    const incomeTaxRate = 0.2; // TODO: Implement progressive tax rates.
    const incomeTaxAmount = incomesData.totalGrossIncome * incomeTaxRate;
    const netIncome = incomesData.totalGrossIncome - incomeTaxAmount;
    return { incomeTaxRate, incomeTaxAmount, netIncome };
  }
}
