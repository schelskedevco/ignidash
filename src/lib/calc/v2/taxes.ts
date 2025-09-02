import { SimulationState } from './simulation-engine';

import { IncomesData } from './incomes';

export interface TaxesData {
  temp: string;
}

export interface IncomeTaxesData {
  taxRate: number;
  taxAmount: number;
}

export class TaxProcessor {
  constructor(private simulationState: SimulationState) {}

  process(): void {
    return;
  }

  processIncomeTax(incomesData: IncomesData): IncomeTaxesData {
    const taxRate = 0.2; // TODO: Implement progressive tax rates.
    const taxAmount = incomesData.totalGrossIncome * taxRate;
    return { taxRate, taxAmount };
  }
}
