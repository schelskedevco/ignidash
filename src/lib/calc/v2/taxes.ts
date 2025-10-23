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
  adjustedGrossIncome: number;
  incomeTaxes: IncomeTaxesData;
  capitalGainsTaxes: CapitalGainsTaxesData;
  earlyWithdrawalPenalties: EarlyWithdrawalPenaltyData;
  totalTaxesDue: number;
  totalTaxesRefund: number;
  totalTaxableIncome: number;
  adjustments: Record<string, number>;
  deductions: Record<string, number>;
}

export interface EarlyWithdrawalPenaltyData {
  taxDeferredPenaltyAmount: number;
  taxFreePenaltyAmount: number;
  totalPenaltyAmount: number;
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
  private capitalLossCarryover = 0;

  constructor(private simulationState: SimulationState) {}

  process(annualPortfolioDataBeforeTaxes: PortfolioData, annualIncomesData: IncomesData, annualReturnsData: ReturnsData): TaxesData {
    const { grossOrdinaryIncome, taxDeferredContributions } = this.getGrossOrdinaryIncome(
      annualPortfolioDataBeforeTaxes,
      annualIncomesData,
      annualReturnsData
    );

    const { grossRealizedGains, capitalLossDeduction } = this.getGrossRealizedGainsAndCapLossDeduction(annualPortfolioDataBeforeTaxes);

    const grossDividendIncome = annualReturnsData.yieldAmountsForPeriod.taxable.stocks;
    const grossIncomeTaxedAsCapGains = grossRealizedGains + grossDividendIncome;

    const adjustedGrossOrdinaryIncome = Math.max(0, grossOrdinaryIncome + capitalLossDeduction);

    const deductionUsedForOrdinary = Math.min(STANDARD_DEDUCTION_SINGLE, adjustedGrossOrdinaryIncome);
    const deductionUsedForGains = STANDARD_DEDUCTION_SINGLE - deductionUsedForOrdinary;

    const taxableOrdinaryIncome = Math.max(0, adjustedGrossOrdinaryIncome - deductionUsedForOrdinary);
    const taxableCapitalGains = Math.max(0, grossIncomeTaxedAsCapGains - deductionUsedForGains);

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
      effectiveCapitalGainsTaxRate: grossIncomeTaxedAsCapGains > 0 ? capitalGainsTaxAmount / grossIncomeTaxedAsCapGains : 0,
      topMarginalCapitalGainsTaxRate,
      netCapitalGains: grossIncomeTaxedAsCapGains - capitalGainsTaxAmount,
    };

    const earlyWithdrawalPenalties = this.processEarlyWithdrawalPenalties(annualPortfolioDataBeforeTaxes);

    const totalTaxLiability =
      incomeTaxes.incomeTaxAmount + capitalGainsTaxes.capitalGainsTaxAmount + earlyWithdrawalPenalties.totalPenaltyAmount;
    const difference = totalTaxLiability - annualIncomesData.totalAmountWithheld;

    return {
      adjustedGrossIncome: adjustedGrossOrdinaryIncome + grossIncomeTaxedAsCapGains,
      incomeTaxes,
      capitalGainsTaxes,
      earlyWithdrawalPenalties,
      totalTaxesDue: difference > 0 ? difference : 0,
      totalTaxesRefund: difference < 0 ? Math.abs(difference) : 0,
      totalTaxableIncome: taxableOrdinaryIncome + taxableCapitalGains,
      adjustments: { taxDeferredContributions, capitalLossDeduction },
      deductions: { standardDeduction: STANDARD_DEDUCTION_SINGLE },
    };
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

  private processEarlyWithdrawalPenalties(annualPortfolioDataBeforeTaxes: PortfolioData): EarlyWithdrawalPenaltyData {
    let taxDeferredPenaltyAmount = 0;
    let taxFreePenaltyAmount = 0;

    const age = this.simulationState.time.age;
    const regularQualifiedWithdrawalAge = 59.5;

    if (age < regularQualifiedWithdrawalAge) {
      const taxDeferredWithdrawalsFrom401kAndIra = this.getWithdrawalsForAccountTypes(annualPortfolioDataBeforeTaxes, ['401k', 'ira']);
      taxDeferredPenaltyAmount += taxDeferredWithdrawalsFrom401kAndIra * 0.1;

      const earningsWithdrawnFromRoth = this.getEarningsWithdrawnFromRothAccountTypes(annualPortfolioDataBeforeTaxes);
      taxFreePenaltyAmount += earningsWithdrawnFromRoth * 0.1;
    }

    const hsaQualifiedWithdrawalAge = 65;
    if (age < hsaQualifiedWithdrawalAge) {
      const taxDeferredWithdrawalsFromHsa = this.getWithdrawalsForAccountTypes(annualPortfolioDataBeforeTaxes, ['hsa']);
      taxDeferredPenaltyAmount += taxDeferredWithdrawalsFromHsa * 0.2;
    }

    return { taxDeferredPenaltyAmount, taxFreePenaltyAmount, totalPenaltyAmount: taxDeferredPenaltyAmount + taxFreePenaltyAmount };
  }

  private getGrossOrdinaryIncome(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    annualIncomesData: IncomesData,
    annualReturnsData: ReturnsData
  ): { grossOrdinaryIncome: number; taxDeferredContributions: number } {
    const grossIncomeFromIncomes = annualIncomesData.totalGrossIncome;
    const grossIncomeFromInterest =
      annualReturnsData.yieldAmountsForPeriod.taxable.bonds + annualReturnsData.yieldAmountsForPeriod.cashSavings.cash;

    const age = this.simulationState.time.age;
    const rothEarningsQualifiedWithdrawalAge = 59.5;

    let grossIncomeFromTaxDeferredWithdrawals = this.getWithdrawalsForAccountTypes(annualPortfolioDataBeforeTaxes, ['401k', 'ira', 'hsa']);
    if (age < rothEarningsQualifiedWithdrawalAge) {
      grossIncomeFromTaxDeferredWithdrawals += this.getEarningsWithdrawnFromRothAccountTypes(annualPortfolioDataBeforeTaxes);
    }

    const taxDeferredContributions = this.getContributionsForAccountTypes(annualPortfolioDataBeforeTaxes, ['401k', 'ira', 'hsa']);

    return {
      grossOrdinaryIncome:
        grossIncomeFromIncomes + grossIncomeFromTaxDeferredWithdrawals + grossIncomeFromInterest - taxDeferredContributions,
      taxDeferredContributions,
    };
  }

  private getGrossRealizedGainsAndCapLossDeduction(annualPortfolioDataBeforeTaxes: PortfolioData): {
    grossRealizedGains: number;
    capitalLossDeduction: number;
  } {
    const grossRealizedGains = annualPortfolioDataBeforeTaxes.realizedGainsForPeriod + this.capitalLossCarryover;
    if (grossRealizedGains < 0) {
      const capitalLossDeduction = Math.max(grossRealizedGains, -3000);
      this.capitalLossCarryover = grossRealizedGains - capitalLossDeduction;
      return { grossRealizedGains: 0, capitalLossDeduction };
    } else {
      this.capitalLossCarryover = 0;
      return { grossRealizedGains, capitalLossDeduction: 0 };
    }
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

  private getEarningsWithdrawnFromRothAccountTypes(annualPortfolioDataBeforeTaxes: PortfolioData): number {
    const rothAccountTypes = ['roth401k', 'rothIra'] as AccountInputs['type'][];

    return Object.values(annualPortfolioDataBeforeTaxes.perAccountData)
      .filter((account) => rothAccountTypes.includes(account.type))
      .reduce((sum, account) => sum + account.earningsWithdrawnForPeriod, 0);
  }
}
