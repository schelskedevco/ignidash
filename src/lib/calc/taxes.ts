import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-schema';

import type { SimulationState } from './simulation-engine';
import type { IncomesData } from './incomes';
import type { PortfolioData } from './portfolio';
import type { ReturnsData } from './returns';
import {
  STANDARD_DEDUCTION_SINGLE,
  STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY,
  STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD,
} from './tax-data/standard-deduction';
import {
  type IncomeTaxBracket,
  INCOME_TAX_BRACKETS_SINGLE,
  INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY,
  INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD,
} from './tax-data/income-tax-brackets';
import {
  type CapitalGainsTaxBracket,
  CAPITAL_GAINS_TAX_BRACKETS_SINGLE,
  CAPITAL_GAINS_TAX_BRACKETS_MARRIED_FILING_JOINTLY,
  CAPITAL_GAINS_TAX_BRACKETS_HEAD_OF_HOUSEHOLD,
} from './tax-data/capital-gains-tax-brackets';
import {
  type SocialSecurityTaxBracket,
  SOCIAL_SECURITY_TAX_BRACKETS_SINGLE,
  SOCIAL_SECURITY_TAX_BRACKETS_MARRIED_FILING_JOINTLY,
  SOCIAL_SECURITY_TAX_BRACKETS_HEAD_OF_HOUSEHOLD,
} from './tax-data/social-security-tax-brackets';

export interface CapitalGainsTaxesData {
  taxableCapitalGains: number;
  capitalGainsTaxAmount: number;
  effectiveCapitalGainsTaxRate: number;
  topMarginalCapitalGainsTaxRate: number;
  capitalGainsTaxBrackets: CapitalGainsTaxBracket[];
}

export interface IncomeTaxesData {
  taxableOrdinaryIncome: number;
  incomeTaxAmount: number;
  effectiveIncomeTaxRate: number;
  topMarginalIncomeTaxRate: number;
  incomeTaxBrackets: IncomeTaxBracket[];
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

export class TaxProcessor {
  private capitalLossCarryover = 0;

  constructor(
    private simulationState: SimulationState,
    private filingStatus: FilingStatus
  ) {}

  process(annualPortfolioDataBeforeTaxes: PortfolioData, annualIncomesData: IncomesData, annualReturnsData: ReturnsData): TaxesData {
    const { totalIncome, adjustedOrdinaryIncome, taxDeferredContributions } = this.getIncomeData(
      annualPortfolioDataBeforeTaxes,
      annualIncomesData,
      annualReturnsData
    );
    const { adjustedRealizedGains, capitalLossDeduction } = this.getRealizedGainsAndCapLossDeductionData(annualPortfolioDataBeforeTaxes);

    const adjustedIncomeTaxedAsIncome = Math.max(0, adjustedOrdinaryIncome + capitalLossDeduction);
    const adjustedIncomeTaxedAsCapGains = adjustedRealizedGains + annualReturnsData.yieldAmountsForPeriod.taxable.stocks;
    const adjustedGrossIncome = adjustedIncomeTaxedAsIncome + adjustedIncomeTaxedAsCapGains;
    const _combinedIncome = adjustedGrossIncome + annualIncomesData.totalSocialSecurityIncome * 0.5;

    const standardDeduction = this.getStandardDeduction();
    const deductionUsedForOrdinary = Math.min(standardDeduction, adjustedIncomeTaxedAsIncome);
    const deductionUsedForGains = standardDeduction - deductionUsedForOrdinary;

    const taxableOrdinaryIncome = Math.max(0, adjustedIncomeTaxedAsIncome - deductionUsedForOrdinary);
    const taxableCapitalGains = Math.max(0, adjustedIncomeTaxedAsCapGains - deductionUsedForGains);

    const { incomeTaxAmount, topMarginalIncomeTaxRate, incomeTaxBrackets } = this.processIncomeTaxes(taxableOrdinaryIncome);
    const incomeTaxes: IncomeTaxesData = {
      taxableOrdinaryIncome,
      incomeTaxAmount,
      effectiveIncomeTaxRate: totalIncome > 0 ? incomeTaxAmount / totalIncome : 0,
      topMarginalIncomeTaxRate,
      incomeTaxBrackets,
      capitalLossDeduction: capitalLossDeduction !== 0 ? capitalLossDeduction : undefined,
    };

    const { capitalGainsTaxAmount, topMarginalCapitalGainsTaxRate, capitalGainsTaxBrackets } = this.processCapitalGainsTaxes(
      taxableCapitalGains,
      taxableOrdinaryIncome
    );
    const capitalGainsTaxes: CapitalGainsTaxesData = {
      taxableCapitalGains,
      capitalGainsTaxAmount,
      effectiveCapitalGainsTaxRate: adjustedIncomeTaxedAsCapGains > 0 ? capitalGainsTaxAmount / adjustedIncomeTaxedAsCapGains : 0,
      topMarginalCapitalGainsTaxRate,
      capitalGainsTaxBrackets,
    };

    const earlyWithdrawalPenalties = this.processEarlyWithdrawalPenalties(annualPortfolioDataBeforeTaxes);

    const totalTaxLiabilityExcludingFICA =
      incomeTaxes.incomeTaxAmount + capitalGainsTaxes.capitalGainsTaxAmount + earlyWithdrawalPenalties.totalPenaltyAmount;
    const difference = totalTaxLiabilityExcludingFICA - annualIncomesData.totalAmountWithheld;

    return {
      adjustedGrossIncome,
      incomeTaxes,
      capitalGainsTaxes,
      earlyWithdrawalPenalties,
      totalTaxesDue: difference > 0 ? difference : 0,
      totalTaxesRefund: difference < 0 ? Math.abs(difference) : 0,
      totalTaxableIncome: taxableOrdinaryIncome + taxableCapitalGains,
      adjustments: { taxDeferredContributions, capitalLossDeduction },
      deductions: { standardDeduction },
    };
  }

  private processIncomeTaxes(taxableOrdinaryIncome: number): {
    incomeTaxAmount: number;
    topMarginalIncomeTaxRate: number;
    incomeTaxBrackets: IncomeTaxBracket[];
  } {
    let incomeTaxAmount = 0;
    let topMarginalIncomeTaxRate = 0;

    const incomeTaxBrackets = this.getIncomeTaxBrackets();
    for (const bracket of incomeTaxBrackets) {
      if (taxableOrdinaryIncome <= bracket.min) break;

      const taxableInBracket = Math.min(taxableOrdinaryIncome, bracket.max) - bracket.min;
      incomeTaxAmount += taxableInBracket * bracket.rate;
      topMarginalIncomeTaxRate = bracket.rate;
    }

    return { incomeTaxAmount, topMarginalIncomeTaxRate, incomeTaxBrackets };
  }

  private processCapitalGainsTaxes(
    taxableCapitalGains: number,
    taxableOrdinaryIncome: number
  ): {
    capitalGainsTaxAmount: number;
    topMarginalCapitalGainsTaxRate: number;
    capitalGainsTaxBrackets: CapitalGainsTaxBracket[];
  } {
    const totalTaxableIncome = taxableOrdinaryIncome + taxableCapitalGains;

    let capitalGainsTaxAmount = 0;
    let topMarginalCapitalGainsTaxRate = 0;

    const capitalGainsTaxBrackets = this.getCapitalGainsTaxBrackets();
    for (const bracket of capitalGainsTaxBrackets) {
      if (totalTaxableIncome <= bracket.min) break;

      const incomeInBracket = Math.min(totalTaxableIncome, bracket.max) - bracket.min;
      const ordinaryIncomeInBracket = Math.max(0, Math.min(taxableOrdinaryIncome, bracket.max) - bracket.min);
      const capitalGainsInBracket = incomeInBracket - ordinaryIncomeInBracket;

      capitalGainsTaxAmount += capitalGainsInBracket * bracket.rate;
      topMarginalCapitalGainsTaxRate = bracket.rate;
    }

    return { capitalGainsTaxAmount, topMarginalCapitalGainsTaxRate, capitalGainsTaxBrackets };
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

  private getIncomeData(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    annualIncomesData: IncomesData,
    annualReturnsData: ReturnsData
  ): { totalIncome: number; grossOrdinaryIncome: number; adjustedOrdinaryIncome: number; taxDeferredContributions: number } {
    const grossIncomeFromIncomes = annualIncomesData.totalIncome;
    const grossIncomeFromInterest =
      annualReturnsData.yieldAmountsForPeriod.taxable.bonds + annualReturnsData.yieldAmountsForPeriod.cashSavings.cash;

    const age = this.simulationState.time.age;
    const rothEarningsQualifiedWithdrawalAge = 59.5;

    let grossIncomeFromTaxDeferredWithdrawals = this.getWithdrawalsForAccountTypes(annualPortfolioDataBeforeTaxes, ['401k', 'ira', 'hsa']);
    if (age < rothEarningsQualifiedWithdrawalAge) {
      grossIncomeFromTaxDeferredWithdrawals += this.getEarningsWithdrawnFromRothAccountTypes(annualPortfolioDataBeforeTaxes);
    }

    const taxDeferredContributions = this.getEmployeeContributionsForAccountTypes(annualPortfolioDataBeforeTaxes, ['401k', 'ira', 'hsa']);
    const taxExemptIncome = annualIncomesData.totalTaxExemptIncome;

    const totalIncome = grossIncomeFromIncomes + grossIncomeFromInterest + grossIncomeFromTaxDeferredWithdrawals;
    const grossOrdinaryIncome = Math.max(0, totalIncome - taxExemptIncome);
    const adjustedOrdinaryIncome = Math.max(0, grossOrdinaryIncome - taxDeferredContributions);

    return {
      totalIncome,
      grossOrdinaryIncome,
      adjustedOrdinaryIncome,
      taxDeferredContributions,
    };
  }

  private getRealizedGainsAndCapLossDeductionData(annualPortfolioDataBeforeTaxes: PortfolioData): {
    adjustedRealizedGains: number;
    capitalLossDeduction: number;
  } {
    const adjustedRealizedGains = annualPortfolioDataBeforeTaxes.realizedGainsForPeriod + this.capitalLossCarryover;
    if (adjustedRealizedGains >= 0) {
      this.capitalLossCarryover = 0;
      return { adjustedRealizedGains, capitalLossDeduction: 0 };
    }

    const capitalLossDeduction = Math.max(-3000, adjustedRealizedGains);
    this.capitalLossCarryover = adjustedRealizedGains - capitalLossDeduction;
    return { adjustedRealizedGains: 0, capitalLossDeduction };
  }

  private getEmployeeContributionsForAccountTypes(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    accountTypes: AccountInputs['type'][]
  ): number {
    return Object.values(annualPortfolioDataBeforeTaxes.perAccountData)
      .filter((account) => accountTypes.includes(account.type))
      .reduce((sum, account) => sum + (account.contributionsForPeriod - account.employerMatchForPeriod), 0);
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

  private getStandardDeduction(): number {
    switch (this.filingStatus) {
      case 'single':
        return STANDARD_DEDUCTION_SINGLE;
      case 'marriedFilingJointly':
        return STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY;
      case 'headOfHousehold':
        return STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD;
    }
  }

  private getIncomeTaxBrackets(): IncomeTaxBracket[] {
    switch (this.filingStatus) {
      case 'single':
        return INCOME_TAX_BRACKETS_SINGLE;
      case 'marriedFilingJointly':
        return INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY;
      case 'headOfHousehold':
        return INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD;
    }
  }

  private getCapitalGainsTaxBrackets(): CapitalGainsTaxBracket[] {
    switch (this.filingStatus) {
      case 'single':
        return CAPITAL_GAINS_TAX_BRACKETS_SINGLE;
      case 'marriedFilingJointly':
        return CAPITAL_GAINS_TAX_BRACKETS_MARRIED_FILING_JOINTLY;
      case 'headOfHousehold':
        return CAPITAL_GAINS_TAX_BRACKETS_HEAD_OF_HOUSEHOLD;
    }
  }

  private getSocialSecurityTaxBrackets(): SocialSecurityTaxBracket[] {
    switch (this.filingStatus) {
      case 'single':
        return SOCIAL_SECURITY_TAX_BRACKETS_SINGLE;
      case 'marriedFilingJointly':
        return SOCIAL_SECURITY_TAX_BRACKETS_MARRIED_FILING_JOINTLY;
      case 'headOfHousehold':
        return SOCIAL_SECURITY_TAX_BRACKETS_HEAD_OF_HOUSEHOLD;
    }
  }
}
