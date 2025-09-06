import { SimulationState } from './simulation-engine';

import { IncomesData } from './incomes';
import { PortfolioData } from './portfolio';

export interface IncomeTaxesData {
  incomeTaxRate: number;
  incomeTaxAmount: number;
  netIncome: number;
}

export interface TaxesData {
  incomeTaxes: IncomeTaxesData;
  taxesDue: number;
  taxesRefund: number;
}

export class TaxProcessor {
  constructor(private simulationState: SimulationState) {}

  process(annualPortfolioDataBeforeTaxes: PortfolioData, annualIncomesData: IncomesData): TaxesData {
    const incomeTaxRate = 0.3;
    const incomeTaxAmount = annualIncomesData.totalGrossIncome * incomeTaxRate;

    const netIncome = annualIncomesData.totalGrossIncome - incomeTaxAmount;

    const difference = incomeTaxAmount - annualIncomesData.totalAmountWithheld;
    const taxesDue = difference > 0 ? difference : 0;
    const taxesRefund = difference < 0 ? Math.abs(difference) : 0;

    return { incomeTaxes: { incomeTaxRate, incomeTaxAmount, netIncome }, taxesDue, taxesRefund };
  }
}
