import type { AccountInputs } from '@/lib/schemas/account-form-schema';

import type { SimulationState } from './simulation-engine';
import type { IncomesData } from './incomes';
import type { PortfolioData } from './portfolio';
import type { ReturnsData } from './returns';

export interface CapitalGainsTaxesData {
  taxableCapitalGains: number;
  capitalGainsTaxAmount: number;
  effectiveCapitalGainsTaxRate: number;
  topMarginalCapitalGainsTaxRate: number;
  netCapitalGains: number;
}

export interface IncomeTaxesData {
  taxableOrdinaryIncome: number;
  incomeTaxAmount: number;
  effectiveIncomeTaxRate: number;
  topMarginalTaxRate: number;
  netIncome: number;
  capitalLossDeduction?: number;
}

export interface TaxesData {
  incomeTaxes: IncomeTaxesData;
  capitalGainsTaxes: CapitalGainsTaxesData;
  totalTaxesDue: number;
  totalTaxesRefund: number;
  totalTaxableIncome: number;
  adjustments: Record<string, number>;
  deductions: Record<string, number>;
}

const STANDARD_DEDUCTION_SINGLE = 15000;

export const INCOME_TAX_BRACKETS_SINGLE = [
  { min: 0, max: 11925, rate: 0.1 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

export const CAPITAL_GAINS_TAX_BRACKETS_SINGLE = [
  { min: 0, max: 47025, rate: 0.0 },
  { min: 47025, max: 518900, rate: 0.15 },
  { min: 518900, max: Infinity, rate: 0.2 },
];

export class TaxProcessor {
  constructor(private simulationState: SimulationState) {}

  process(annualPortfolioDataBeforeTaxes: PortfolioData, annualIncomesData: IncomesData, annualReturnsData: ReturnsData): TaxesData {
    const { grossOrdinaryIncome, taxDeferredContributions } = this.getGrossOrdinaryIncome(
      annualPortfolioDataBeforeTaxes,
      annualIncomesData,
      annualReturnsData
    );
    const grossRealizedGains = annualPortfolioDataBeforeTaxes.realizedGainsForPeriod;

    const capitalLossDeduction = Math.min(0, Math.max(-3000, grossRealizedGains));
    const adjustedGrossIncome = Math.max(0, grossOrdinaryIncome + capitalLossDeduction);

    const deductionUsedForOrdinary = Math.min(STANDARD_DEDUCTION_SINGLE, adjustedGrossIncome);
    const deductionUsedForGains = STANDARD_DEDUCTION_SINGLE - deductionUsedForOrdinary;

    const taxableOrdinaryIncome = Math.max(0, adjustedGrossIncome - deductionUsedForOrdinary);
    const taxableCapitalGains = Math.max(0, grossRealizedGains - deductionUsedForGains);

    const { incomeTaxAmount, topMarginalTaxRate } = this.processIncomeTaxes(taxableOrdinaryIncome);
    const incomeTaxes: IncomeTaxesData = {
      taxableOrdinaryIncome,
      incomeTaxAmount,
      effectiveIncomeTaxRate: grossOrdinaryIncome > 0 ? incomeTaxAmount / grossOrdinaryIncome : 0,
      topMarginalTaxRate,
      netIncome: grossOrdinaryIncome - incomeTaxAmount,
      capitalLossDeduction: capitalLossDeduction !== 0 ? capitalLossDeduction : undefined,
    };

    const { capitalGainsTaxAmount, topMarginalCapitalGainsTaxRate } = this.processCapitalGainsTaxes(
      taxableCapitalGains,
      taxableOrdinaryIncome
    );
    const capitalGainsTaxes: CapitalGainsTaxesData = {
      taxableCapitalGains,
      capitalGainsTaxAmount,
      effectiveCapitalGainsTaxRate: grossRealizedGains > 0 ? capitalGainsTaxAmount / grossRealizedGains : 0,
      topMarginalCapitalGainsTaxRate,
      netCapitalGains: grossRealizedGains - capitalGainsTaxAmount,
    };

    const totalTaxLiability = incomeTaxes.incomeTaxAmount + capitalGainsTaxes.capitalGainsTaxAmount;
    const difference = totalTaxLiability - annualIncomesData.totalAmountWithheld;

    return {
      incomeTaxes,
      capitalGainsTaxes,
      totalTaxesDue: difference > 0 ? difference : 0,
      totalTaxesRefund: difference < 0 ? Math.abs(difference) : 0,
      totalTaxableIncome: taxableOrdinaryIncome + taxableCapitalGains,
      adjustments: { taxDeferredContributions, capitalLossDeduction },
      deductions: { standardDeduction: STANDARD_DEDUCTION_SINGLE },
    };
  }

  private processCapitalGainsTaxes(
    taxableCapitalGains: number,
    taxableOrdinaryIncome: number
  ): { capitalGainsTaxAmount: number; topMarginalCapitalGainsTaxRate: number } {
    const totalTaxableIncome = taxableOrdinaryIncome + taxableCapitalGains;

    let capitalGainsTaxAmount = 0;
    let topMarginalCapitalGainsTaxRate = 0;
    for (const bracket of CAPITAL_GAINS_TAX_BRACKETS_SINGLE) {
      if (totalTaxableIncome <= bracket.min) break;

      const incomeInBracket = Math.min(totalTaxableIncome, bracket.max) - bracket.min;
      const ordinaryIncomeInBracket = Math.max(0, Math.min(taxableOrdinaryIncome, bracket.max) - bracket.min);
      const capitalGainsInBracket = incomeInBracket - ordinaryIncomeInBracket;

      capitalGainsTaxAmount += capitalGainsInBracket * bracket.rate;
      topMarginalCapitalGainsTaxRate = bracket.rate;
    }

    return { capitalGainsTaxAmount, topMarginalCapitalGainsTaxRate };
  }

  private processIncomeTaxes(taxableOrdinaryIncome: number): { incomeTaxAmount: number; topMarginalTaxRate: number } {
    let incomeTaxAmount = 0;
    let topMarginalTaxRate = 0;
    for (const bracket of INCOME_TAX_BRACKETS_SINGLE) {
      if (taxableOrdinaryIncome <= bracket.min) break;

      const taxableInBracket = Math.min(taxableOrdinaryIncome, bracket.max) - bracket.min;
      incomeTaxAmount += taxableInBracket * bracket.rate;
      topMarginalTaxRate = bracket.rate;
    }

    return { incomeTaxAmount, topMarginalTaxRate };
  }

  private getGrossOrdinaryIncome(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    annualIncomesData: IncomesData,
    annualReturnsData: ReturnsData
  ): { grossOrdinaryIncome: number; taxDeferredContributions: number } {
    const grossIncomeFromIncomes = annualIncomesData.totalGrossIncome;
    const grossIncomeFromTaxDeferredWithdrawals = this.getWithdrawalsForAccountTypes(annualPortfolioDataBeforeTaxes, ['401k', 'ira']);
    const grossIncomeFromInterest =
      annualReturnsData.returnAmountsForPeriod.cash + annualReturnsData.yieldAmountsForPeriod.taxable.bondYield;

    const taxDeferredContributions = this.getContributionsForAccountTypes(annualPortfolioDataBeforeTaxes, ['401k', 'ira', 'hsa']);

    return {
      grossOrdinaryIncome:
        grossIncomeFromIncomes + grossIncomeFromTaxDeferredWithdrawals + grossIncomeFromInterest - taxDeferredContributions,
      taxDeferredContributions,
    };
  }

  private getContributionsForAccountTypes(annualPortfolioDataBeforeTaxes: PortfolioData, accountTypes: AccountInputs['type'][]): number {
    return Object.values(annualPortfolioDataBeforeTaxes.perAccountData)
      .filter((account) => accountTypes.includes(account.type))
      .reduce((sum, account) => sum + account.contributionsForPeriod, 0);
  }

  private getWithdrawalsForAccountTypes(annualPortfolioDataBeforeTaxes: PortfolioData, accountTypes: AccountInputs['type'][]): number {
    return Object.values(annualPortfolioDataBeforeTaxes.perAccountData)
      .filter((account) => accountTypes.includes(account.type))
      .reduce((sum, account) => sum + account.withdrawalsForPeriod, 0);
  }
}
