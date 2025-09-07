import { SimulationState } from './simulation-engine';

import { IncomesData } from './incomes';
import { PortfolioData } from './portfolio';

export interface CapitalGainsTaxesData {
  capitalGainsTaxAmount: number;
  effectiveCapitalGainsTaxRate: number;
  netCapitalGains: number;
}

export interface IncomeTaxesData {
  incomeTaxAmount: number;
  effectiveIncomeTaxRate: number;
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
    const grossOrdinaryIncomeAfterCapitalLoss = Math.max(0, grossOrdinaryIncome + capitalLossDeduction);

    const deductionUsedForOrdinary = Math.min(STANDARD_DEDUCTION_SINGLE, grossOrdinaryIncomeAfterCapitalLoss);
    const deductionUsedForGains = STANDARD_DEDUCTION_SINGLE - deductionUsedForOrdinary;

    const taxableOrdinaryIncome = Math.max(0, grossOrdinaryIncomeAfterCapitalLoss - deductionUsedForOrdinary);
    const taxableCapitalGains = Math.max(0, grossRealizedGains - deductionUsedForGains);

    const incomeTaxAmount = this.processIncomeTaxes(taxableOrdinaryIncome);
    const incomeTaxes: IncomeTaxesData = {
      incomeTaxAmount,
      effectiveIncomeTaxRate: grossOrdinaryIncomeAfterCapitalLoss > 0 ? incomeTaxAmount / grossOrdinaryIncomeAfterCapitalLoss : 0,
      netIncome: grossOrdinaryIncomeAfterCapitalLoss - incomeTaxAmount,
    };

    const capitalGainsTaxAmount = this.processCapitalGainsTaxes(taxableCapitalGains, taxableOrdinaryIncome);
    const capitalGainsTaxes: CapitalGainsTaxesData = {
      capitalGainsTaxAmount,
      effectiveCapitalGainsTaxRate: taxableCapitalGains > 0 ? capitalGainsTaxAmount / taxableCapitalGains : 0,
      netCapitalGains: taxableCapitalGains - capitalGainsTaxAmount,
    };

    const totalTaxLiability = incomeTaxes.incomeTaxAmount + capitalGainsTaxes.capitalGainsTaxAmount;
    const difference = totalTaxLiability - annualIncomesData.totalAmountWithheld;

    return {
      incomeTaxes,
      capitalGainsTaxes,
      totalTaxesDue: difference > 0 ? difference : 0,
      totalTaxesRefund: difference < 0 ? Math.abs(difference) : 0,
    };
  }

  private processCapitalGainsTaxes(taxableCapitalGains: number, taxableOrdinaryIncome: number): number {
    let remainingGains = taxableCapitalGains;
    let currentPosition = taxableOrdinaryIncome;

    let capitalGainsTaxAmount = 0;
    for (const bracket of CAPITAL_GAINS_TAX_BRACKETS_SINGLE) {
      if (remainingGains <= 0 || currentPosition >= bracket.max) continue;

      const gainsInBracket = Math.min(remainingGains, Math.max(0, bracket.max - Math.max(currentPosition, bracket.min)));

      capitalGainsTaxAmount += gainsInBracket * bracket.rate;
      remainingGains -= gainsInBracket;
      currentPosition += gainsInBracket;
    }

    return capitalGainsTaxAmount;
  }

  private processIncomeTaxes(taxableOrdinaryIncome: number): number {
    let incomeTaxAmount = 0;
    for (const bracket of INCOME_TAX_BRACKETS_SINGLE) {
      if (taxableOrdinaryIncome <= bracket.min) break;

      const taxableInBracket = Math.min(taxableOrdinaryIncome, bracket.max) - bracket.min;
      incomeTaxAmount += taxableInBracket * bracket.rate;
    }

    return incomeTaxAmount;
  }
}
