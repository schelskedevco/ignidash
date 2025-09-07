import { SimulationState } from './simulation-engine';

import { IncomesData } from './incomes';
import { PortfolioData } from './portfolio';

export interface CapitalGainsTaxesData {
  capitalGainsTaxRate: number;
  capitalGainsTaxAmount: number;
}

export interface IncomeTaxesData {
  incomeTaxRate: number;
  incomeTaxAmount: number;
  netIncome: number;
}

export interface TaxesData {
  incomeTaxes: IncomeTaxesData;
  capitalGainsTaxes: CapitalGainsTaxesData;
  totalTaxesDue: number;
  totalTaxesRefund: number;
}

const STANDARD_DEDUCTION_SINGLE = 15000;

const INCOME_TAX_BRACKETS_SINGLE = [
  { min: 0, max: 11925, rate: 0.1 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const CAPITAL_GAINS_TAX_BRACKETS_SINGLE = [
  { min: 0, max: 47025, rate: 0.0 },
  { min: 47025, max: 518900, rate: 0.15 },
  { min: 518900, max: Infinity, rate: 0.2 },
];

export class TaxProcessor {
  constructor(private simulationState: SimulationState) {}

  process(annualPortfolioDataBeforeTaxes: PortfolioData, annualIncomesData: IncomesData): TaxesData {
    const grossOrdinaryIncome = annualIncomesData.totalGrossIncome;
    const grossRealizedGains = annualPortfolioDataBeforeTaxes.realizedGainsForPeriod;

    const capitalLossDeduction = Math.min(0, Math.max(-3000, grossRealizedGains));
    const adjustedGrossOrdinaryIncome = grossOrdinaryIncome + capitalLossDeduction;
    const capitalGainsForTaxCalculation = Math.max(0, grossRealizedGains);

    const deductionUsedForOrdinary = Math.min(STANDARD_DEDUCTION_SINGLE, adjustedGrossOrdinaryIncome);
    const deductionUsedForGains = STANDARD_DEDUCTION_SINGLE - deductionUsedForOrdinary;

    const taxableOrdinaryIncome = Math.max(0, adjustedGrossOrdinaryIncome - deductionUsedForOrdinary);
    const taxableCapitalGains = Math.max(0, capitalGainsForTaxCalculation - deductionUsedForGains);

    const incomeTaxes = this.processIncomeTaxes(adjustedGrossOrdinaryIncome, taxableOrdinaryIncome);
    const capitalGainsTaxes = this.processCapitalGainsTaxes(taxableCapitalGains, taxableOrdinaryIncome);

    const totalTaxLiability = incomeTaxes.incomeTaxAmount + capitalGainsTaxes.capitalGainsTaxAmount;

    const difference = totalTaxLiability - annualIncomesData.totalAmountWithheld;
    const totalTaxesDue = difference > 0 ? difference : 0;
    const totalTaxesRefund = difference < 0 ? Math.abs(difference) : 0;

    return { incomeTaxes, capitalGainsTaxes, totalTaxesDue, totalTaxesRefund };
  }

  // Capital gains are "stacked on top" of ordinary income
  private processCapitalGainsTaxes(taxableCapitalGains: number, taxableOrdinaryIncome: number): CapitalGainsTaxesData {
    let capitalGainsTaxAmount = 0;
    let remainingGains = taxableCapitalGains;
    let currentPosition = taxableOrdinaryIncome; // Start where ordinary income ends

    for (const bracket of CAPITAL_GAINS_TAX_BRACKETS_SINGLE) {
      if (remainingGains <= 0 || currentPosition >= bracket.max) continue;

      const gainsInBracket = Math.min(remainingGains, Math.max(0, bracket.max - Math.max(currentPosition, bracket.min)));

      capitalGainsTaxAmount += gainsInBracket * bracket.rate;
      remainingGains -= gainsInBracket;
      currentPosition += gainsInBracket;
    }

    const capitalGainsTaxRate = taxableCapitalGains > 0 ? capitalGainsTaxAmount / taxableCapitalGains : 0;
    return { capitalGainsTaxRate, capitalGainsTaxAmount };
  }

  private processIncomeTaxes(adjustedGrossOrdinaryIncome: number, taxableOrdinaryIncome: number): IncomeTaxesData {
    let incomeTaxAmount = 0;
    for (const bracket of INCOME_TAX_BRACKETS_SINGLE) {
      if (taxableOrdinaryIncome <= bracket.min) break;

      const taxableInBracket = Math.min(taxableOrdinaryIncome, bracket.max) - bracket.min;
      incomeTaxAmount += taxableInBracket * bracket.rate;
    }

    const incomeTaxRate = adjustedGrossOrdinaryIncome > 0 ? incomeTaxAmount / adjustedGrossOrdinaryIncome : 0;
    const netIncome = adjustedGrossOrdinaryIncome - incomeTaxAmount;

    return { incomeTaxRate, incomeTaxAmount, netIncome };
  }
}
