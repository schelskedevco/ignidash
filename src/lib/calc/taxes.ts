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
import { NIIT_RATE, NIIT_THRESHOLDS } from './tax-data/niit-thresholds';
import {
  type SocialSecurityTaxThreshold,
  SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE,
  SOCIAL_SECURITY_TAX_THRESHOLDS_MARRIED_FILING_JOINTLY,
  SOCIAL_SECURITY_TAX_THRESHOLDS_HEAD_OF_HOUSEHOLD,
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

export interface NIITData {
  netInvestmentIncome: number;
  incomeSubjectToNiit: number;
  niitAmount: number;
  threshold: number;
}

export interface TaxesData {
  adjustedGrossIncome: number;
  incomeTaxes: IncomeTaxesData;
  capitalGainsTaxes: CapitalGainsTaxesData;
  niit: NIITData;
  earlyWithdrawalPenalties: EarlyWithdrawalPenaltyData;
  socialSecurityTaxes: SocialSecurityTaxesData;
  incomeSources: IncomeSourcesData;
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

export interface SocialSecurityTaxesData {
  taxableSocialSecurity: number;
  maxTaxablePercentage: number;
  actualTaxablePercentage: number;
  provisionalIncome: number;
}

// TODO: Add more income source data
// Reduces code duplication from getTaxableIncomeSources
export interface IncomeSourcesData {
  taxableRealizedGains: number;
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
    const { taxableRealizedGains, capitalLossDeduction } = this.getRealizedGainsAndCapLossDeductionData(annualPortfolioDataBeforeTaxes);

    let adjustedIncomeTaxedAsIncome = Math.max(0, adjustedOrdinaryIncome - capitalLossDeduction);
    const adjustedIncomeTaxedAsCapGains = taxableRealizedGains + annualReturnsData.yieldAmountsForPeriod.taxable.stocks;

    const socialSecurityIncome = annualIncomesData.totalSocialSecurityIncome;
    const provisionalIncome = adjustedIncomeTaxedAsIncome + adjustedIncomeTaxedAsCapGains + socialSecurityIncome * 0.5;

    const { taxableSocialSecurity, maxTaxablePercentage } = this.getTaxablePortionOfSocialSecurityIncome(
      provisionalIncome,
      socialSecurityIncome
    );
    adjustedIncomeTaxedAsIncome += taxableSocialSecurity;
    const socialSecurityTaxes: SocialSecurityTaxesData = {
      taxableSocialSecurity,
      maxTaxablePercentage,
      actualTaxablePercentage: socialSecurityIncome > 0 ? taxableSocialSecurity / socialSecurityIncome : 0,
      provisionalIncome,
    };

    const adjustedGrossIncome = adjustedIncomeTaxedAsIncome + adjustedIncomeTaxedAsCapGains;

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

    const niit = this.processNIIT(annualReturnsData, adjustedGrossIncome, taxableRealizedGains, capitalLossDeduction);

    const earlyWithdrawalPenalties = this.processEarlyWithdrawalPenalties(annualPortfolioDataBeforeTaxes);

    const totalTaxLiabilityExcludingFICA =
      incomeTaxes.incomeTaxAmount + capitalGainsTaxes.capitalGainsTaxAmount + niit.niitAmount + earlyWithdrawalPenalties.totalPenaltyAmount;
    const difference = totalTaxLiabilityExcludingFICA - annualIncomesData.totalAmountWithheld;

    return {
      adjustedGrossIncome,
      incomeTaxes,
      capitalGainsTaxes,
      niit,
      earlyWithdrawalPenalties,
      socialSecurityTaxes,
      incomeSources: { taxableRealizedGains },
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

  private processNIIT(
    annualReturnsData: ReturnsData,
    adjustedGrossIncome: number,
    taxableRealizedGains: number,
    capitalLossDeduction: number
  ): NIITData {
    const threshold = NIIT_THRESHOLDS[this.filingStatus];

    const taxableDividends = annualReturnsData.yieldAmountsForPeriod.taxable.stocks;
    const taxableInterest =
      annualReturnsData.yieldAmountsForPeriod.taxable.bonds + annualReturnsData.yieldAmountsForPeriod.cashSavings.cash;

    // Capital gains are already reduced by losses (taxableRealizedGains >= 0).
    // Excess losses (up to $3K) can offset other investment income.
    const otherInvestmentIncome = Math.max(0, taxableDividends + taxableInterest - capitalLossDeduction);
    const netInvestmentIncome = taxableRealizedGains + otherInvestmentIncome;

    const magiOverThreshold = Math.max(0, adjustedGrossIncome - threshold);
    const incomeSubjectToNiit = Math.min(netInvestmentIncome, magiOverThreshold);
    const niitAmount = incomeSubjectToNiit * NIIT_RATE;

    return { netInvestmentIncome, incomeSubjectToNiit, niitAmount, threshold };
  }

  private processEarlyWithdrawalPenalties(annualPortfolioDataBeforeTaxes: PortfolioData): EarlyWithdrawalPenaltyData {
    let taxDeferredPenaltyAmount = 0;
    let taxFreePenaltyAmount = 0;

    const age = this.simulationState.time.age;
    const regularQualifiedWithdrawalAge = 59.5;

    if (age < regularQualifiedWithdrawalAge) {
      const taxDeferredWithdrawalsFrom401kAndIra = this.getWithdrawalsForAccountTypes(annualPortfolioDataBeforeTaxes, [
        '401k',
        '403b',
        'ira',
      ]);
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
    const totalIncomeFromIncomes = annualIncomesData.totalIncome;
    const taxableInterest =
      annualReturnsData.yieldAmountsForPeriod.taxable.bonds + annualReturnsData.yieldAmountsForPeriod.cashSavings.cash;

    const age = this.simulationState.time.age;
    const rothEarningsQualifiedWithdrawalAge = 59.5;

    let taxDeferredWithdrawals = this.getWithdrawalsForAccountTypes(annualPortfolioDataBeforeTaxes, ['401k', '403b', 'ira', 'hsa']);
    if (age < rothEarningsQualifiedWithdrawalAge) {
      taxDeferredWithdrawals += this.getEarningsWithdrawnFromRothAccountTypes(annualPortfolioDataBeforeTaxes);
    }

    const taxDeferredContributions = this.getEmployeeContributionsForAccountTypes(annualPortfolioDataBeforeTaxes, [
      '401k',
      '403b',
      'ira',
      'hsa',
    ]);
    const socialSecurityIncome = annualIncomesData.totalSocialSecurityIncome;
    const taxExemptIncome = annualIncomesData.totalTaxExemptIncome;

    const totalIncome = totalIncomeFromIncomes + taxableInterest + taxDeferredWithdrawals;
    const grossOrdinaryIncome = Math.max(0, totalIncome - socialSecurityIncome - taxExemptIncome);
    const adjustedOrdinaryIncome = Math.max(0, grossOrdinaryIncome - taxDeferredContributions);

    return {
      totalIncome,
      grossOrdinaryIncome,
      adjustedOrdinaryIncome,
      taxDeferredContributions,
    };
  }

  private getRealizedGainsAndCapLossDeductionData(annualPortfolioDataBeforeTaxes: PortfolioData): {
    taxableRealizedGains: number;
    capitalLossDeduction: number;
  } {
    const realizedGainsAfterCarryover = annualPortfolioDataBeforeTaxes.realizedGainsForPeriod + this.capitalLossCarryover;
    if (realizedGainsAfterCarryover >= 0) {
      this.capitalLossCarryover = 0;
      return { taxableRealizedGains: realizedGainsAfterCarryover, capitalLossDeduction: 0 };
    } else {
      const capitalLossDeduction = -Math.max(-3000, realizedGainsAfterCarryover);
      this.capitalLossCarryover = realizedGainsAfterCarryover + capitalLossDeduction;
      return { taxableRealizedGains: 0, capitalLossDeduction };
    }
  }

  private getTaxablePortionOfSocialSecurityIncome(
    provisionalIncome: number,
    totalSocialSecurityIncome: number
  ): { taxableSocialSecurity: number; maxTaxablePercentage: number } {
    const thresholds = this.getSocialSecurityTaxThresholds();

    if (provisionalIncome <= thresholds[0].max) return { taxableSocialSecurity: 0, maxTaxablePercentage: 0 };

    if (provisionalIncome > thresholds[1].min && provisionalIncome <= thresholds[1].max) {
      const excessIncome = provisionalIncome - thresholds[1].min;
      return { taxableSocialSecurity: Math.min(excessIncome * 0.5, totalSocialSecurityIncome * 0.5), maxTaxablePercentage: 0.5 };
    }

    const tier1Excess = thresholds[1].max - thresholds[1].min;
    const tier1Amount = Math.min(tier1Excess * 0.5, totalSocialSecurityIncome * 0.5);

    const tier2Excess = provisionalIncome - thresholds[2].min;
    const tier2Amount = tier2Excess * 0.85;

    return { taxableSocialSecurity: Math.min(tier1Amount + tier2Amount, totalSocialSecurityIncome * 0.85), maxTaxablePercentage: 0.85 };
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
    const rothAccountTypes = ['roth401k', 'roth403b', 'rothIra'] as AccountInputs['type'][];

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

  private getSocialSecurityTaxThresholds(): SocialSecurityTaxThreshold[] {
    switch (this.filingStatus) {
      case 'single':
        return SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE;
      case 'marriedFilingJointly':
        return SOCIAL_SECURITY_TAX_THRESHOLDS_MARRIED_FILING_JOINTLY;
      case 'headOfHousehold':
        return SOCIAL_SECURITY_TAX_THRESHOLDS_HEAD_OF_HOUSEHOLD;
    }
  }
}
