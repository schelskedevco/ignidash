import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-schema';

import type { SimulationState } from './simulation-engine';
import type { IncomesData } from './incomes';
import type { PortfolioData } from './portfolio';
import type { ReturnsData } from './returns';
import type { PhysicalAssetsData } from './physical-assets';
import { sumTransactions } from './asset';
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
import { SECTION_121_EXCLUSION } from './tax-data/section-121-exclusion';

export interface CapitalGainsTaxesData {
  taxableIncomeTaxedAsCapGains: number;
  capitalGainsTaxAmount: number;
  effectiveCapitalGainsTaxRate: number;
  topMarginalCapitalGainsTaxRate: number;
  capitalGainsTaxBrackets: CapitalGainsTaxBracket[];
}

export interface IncomeTaxesData {
  taxableIncomeTaxedAsOrdinary: number;
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
  taxableSocialSecurityIncome: number;
  maxTaxablePercentage: number;
  actualTaxablePercentage: number;
  provisionalIncome: number;
}

export interface IncomeSourcesData {
  realizedGains: number;
  capitalLossDeduction: number;
  section121Exclusion: number;
  taxDeferredWithdrawals: number;
  taxableRetirementDistributions: number;
  taxableDividendIncome: number;
  taxableInterestIncome: number;
  earnedIncome: number;
  socialSecurityIncome: number;
  taxableSocialSecurityIncome: number;
  maxTaxableSocialSecurityPercentage: number;
  provisionalIncome: number;
  taxFreeIncome: number;
  grossIncome: number;
  incomeTaxedAsOrdinary: number;
  incomeTaxedAsLtcg: number;
  taxDeductibleContributions: number;
  adjustedGrossIncome: number;
  adjustedIncomeTaxedAsOrdinary: number;
  adjustedIncomeTaxedAsCapGains: number;
  totalIncome: number;
  earlyWithdrawals: {
    rothEarnings: number;
    '401kAndIra': number;
    hsa: number;
  };
}

export class TaxProcessor {
  private capitalLossCarryover = 0;
  private capitalLossCarryoverSnapshot: number | null = null;

  constructor(
    private simulationState: SimulationState,
    private filingStatus: FilingStatus
  ) {}

  /** Save carryover state before first tax calculation of the year */
  saveCarryoverSnapshot(): void {
    this.capitalLossCarryoverSnapshot = this.capitalLossCarryover;
  }

  /** Restore carryover state before each convergence iteration */
  restoreCarryoverSnapshot(): void {
    if (this.capitalLossCarryoverSnapshot !== null) {
      this.capitalLossCarryover = this.capitalLossCarryoverSnapshot;
    }
  }

  process(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    annualIncomesData: IncomesData,
    annualReturnsData: ReturnsData,
    annualPhysicalAssetsData: PhysicalAssetsData
  ): TaxesData {
    const incomeData = this.getTaxableIncomeData(
      annualPortfolioDataBeforeTaxes,
      annualIncomesData,
      annualReturnsData,
      annualPhysicalAssetsData
    );

    const socialSecurityTaxes: SocialSecurityTaxesData = {
      taxableSocialSecurityIncome: incomeData.taxableSocialSecurityIncome,
      maxTaxablePercentage: incomeData.maxTaxableSocialSecurityPercentage,
      actualTaxablePercentage:
        incomeData.socialSecurityIncome > 0 ? incomeData.taxableSocialSecurityIncome / incomeData.socialSecurityIncome : 0,
      provisionalIncome: incomeData.provisionalIncome,
    };

    const standardDeduction = this.getStandardDeduction();
    const deductionUsedForOrdinary = Math.min(standardDeduction, incomeData.adjustedIncomeTaxedAsOrdinary);
    const deductionUsedForGains = standardDeduction - deductionUsedForOrdinary;

    const taxableIncomeTaxedAsOrdinary = Math.max(0, incomeData.adjustedIncomeTaxedAsOrdinary - deductionUsedForOrdinary);
    const taxableIncomeTaxedAsCapGains = Math.max(0, incomeData.adjustedIncomeTaxedAsCapGains - deductionUsedForGains);

    const { incomeTaxAmount, topMarginalIncomeTaxRate, incomeTaxBrackets } = this.processIncomeTaxes({ taxableIncomeTaxedAsOrdinary });
    const incomeTaxes: IncomeTaxesData = {
      taxableIncomeTaxedAsOrdinary,
      incomeTaxAmount,
      effectiveIncomeTaxRate: incomeData.totalIncome > 0 ? incomeTaxAmount / incomeData.totalIncome : 0,
      topMarginalIncomeTaxRate,
      incomeTaxBrackets,
      capitalLossDeduction: incomeData.capitalLossDeduction !== 0 ? incomeData.capitalLossDeduction : undefined,
    };

    const { capitalGainsTaxAmount, topMarginalCapitalGainsTaxRate, capitalGainsTaxBrackets } = this.processCapitalGainsTaxes({
      taxableIncomeTaxedAsCapGains,
      taxableIncomeTaxedAsOrdinary,
    });
    const capitalGainsTaxes: CapitalGainsTaxesData = {
      taxableIncomeTaxedAsCapGains,
      capitalGainsTaxAmount,
      effectiveCapitalGainsTaxRate:
        incomeData.adjustedIncomeTaxedAsCapGains > 0 ? capitalGainsTaxAmount / incomeData.adjustedIncomeTaxedAsCapGains : 0,
      topMarginalCapitalGainsTaxRate,
      capitalGainsTaxBrackets,
    };

    const niit = this.processNIIT(incomeData);

    const earlyWithdrawalPenalties = this.processEarlyWithdrawalPenalties(incomeData.earlyWithdrawals);

    const totalTaxLiabilityExcludingFICA =
      incomeTaxes.incomeTaxAmount + capitalGainsTaxes.capitalGainsTaxAmount + niit.niitAmount + earlyWithdrawalPenalties.totalPenaltyAmount;
    const difference = totalTaxLiabilityExcludingFICA - annualIncomesData.totalAmountWithheld;

    return {
      incomeTaxes,
      capitalGainsTaxes,
      niit,
      earlyWithdrawalPenalties,
      socialSecurityTaxes,
      incomeSources: incomeData,
      totalTaxesDue: difference > 0 ? difference : 0,
      totalTaxesRefund: difference < 0 ? Math.abs(difference) : 0,
      totalTaxableIncome: taxableIncomeTaxedAsOrdinary + taxableIncomeTaxedAsCapGains,
      adjustments: {
        taxDeductibleContributions: incomeData.taxDeductibleContributions,
        capitalLossDeduction: incomeData.capitalLossDeduction,
        section121Exclusion: incomeData.section121Exclusion,
      },
      deductions: { standardDeduction },
    };
  }

  private getTaxableIncomeData(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    annualIncomesData: IncomesData,
    annualReturnsData: ReturnsData,
    annualPhysicalAssetsData: PhysicalAssetsData
  ): IncomeSourcesData {
    const age = this.simulationState.time.age;

    const regularQualifiedWithdrawalAge = 59.5;
    const hsaQualifiedWithdrawalAge = 65;

    let taxDeferredWithdrawals = 0;
    let earlyRothEarningsWithdrawals = 0;
    let early401kAndIraWithdrawals = 0;
    let earlyHsaWithdrawals = 0;

    for (const account of Object.values(annualPortfolioDataBeforeTaxes.perAccountData)) {
      switch (account.type) {
        case 'roth401k':
        case 'roth403b':
        case 'rothIra': {
          if (age < regularQualifiedWithdrawalAge) {
            const annualEarningsWithdrawn = account.earningsWithdrawnForPeriod;

            earlyRothEarningsWithdrawals += annualEarningsWithdrawn;
          }
          break;
        }
        case '401k':
        case '403b':
        case 'ira': {
          const annualWithdrawals = sumTransactions(account.withdrawalsForPeriod);

          taxDeferredWithdrawals += annualWithdrawals;
          if (age < regularQualifiedWithdrawalAge) early401kAndIraWithdrawals += annualWithdrawals;
          break;
        }
        case 'hsa': {
          const annualWithdrawals = sumTransactions(account.withdrawalsForPeriod);

          taxDeferredWithdrawals += annualWithdrawals;
          if (age < hsaQualifiedWithdrawalAge) earlyHsaWithdrawals += annualWithdrawals;
          break;
        }
        default:
          break;
      }
    }

    const taxableRetirementDistributions = taxDeferredWithdrawals + earlyRothEarningsWithdrawals;
    const { realizedGains, capitalLossDeduction, section121Exclusion } = this.getRealizedGainsAndCapLossDeductionData(
      annualPortfolioDataBeforeTaxes,
      annualPhysicalAssetsData
    );
    const taxableDividendIncome = annualReturnsData.yieldAmountsForPeriod.taxable.stocks;
    const taxableInterestIncome =
      annualReturnsData.yieldAmountsForPeriod.taxable.bonds + annualReturnsData.yieldAmountsForPeriod.cashSavings.cash;

    const totalIncomeFromIncomes = annualIncomesData.totalIncome;
    const socialSecurityIncome = annualIncomesData.totalSocialSecurityIncome;
    const taxFreeIncome = annualIncomesData.totalTaxFreeIncome;
    const earnedIncome = totalIncomeFromIncomes - socialSecurityIncome - taxFreeIncome;

    const incomeTaxedAsOrdinaryExceptSocSec = earnedIncome + taxableRetirementDistributions + taxableInterestIncome;
    const incomeTaxedAsLtcg = realizedGains + taxableDividendIncome;
    const grossIncomeExceptSocSec = incomeTaxedAsOrdinaryExceptSocSec + incomeTaxedAsLtcg;

    const taxDeferredAccountTypes: AccountInputs['type'][] = ['401k', '403b', 'ira', 'hsa'];
    const taxDeductibleContributions = this.getEmployeeContributionsForAccountTypes(
      annualPortfolioDataBeforeTaxes,
      taxDeferredAccountTypes
    );

    const totalAdjustments = taxDeductibleContributions + capitalLossDeduction;
    const adjustmentsAppliedToOrdinary = Math.min(totalAdjustments, incomeTaxedAsOrdinaryExceptSocSec);
    const adjustmentsAppliedToCapGains = totalAdjustments - adjustmentsAppliedToOrdinary;

    const adjustedIncomeTaxedAsOrdinaryExceptSocSec = incomeTaxedAsOrdinaryExceptSocSec - adjustmentsAppliedToOrdinary;
    const adjustedIncomeTaxedAsCapGains = Math.max(0, incomeTaxedAsLtcg - adjustmentsAppliedToCapGains);
    const adjustedGrossIncomeExceptSocSec = adjustedIncomeTaxedAsOrdinaryExceptSocSec + adjustedIncomeTaxedAsCapGains;

    const provisionalIncome = adjustedGrossIncomeExceptSocSec + socialSecurityIncome * 0.5;
    const { taxableSocialSecurityIncome, maxTaxableSocialSecurityPercentage } = this.getTaxablePortionOfSocialSecurityIncome({
      provisionalIncome,
      socialSecurityIncome,
    });

    const incomeTaxedAsOrdinary = incomeTaxedAsOrdinaryExceptSocSec + taxableSocialSecurityIncome;
    const adjustedIncomeTaxedAsOrdinary = adjustedIncomeTaxedAsOrdinaryExceptSocSec + taxableSocialSecurityIncome;
    const adjustedGrossIncome = adjustedIncomeTaxedAsOrdinary + adjustedIncomeTaxedAsCapGains;

    const grossIncome = grossIncomeExceptSocSec + taxableSocialSecurityIncome;
    const totalIncome = grossIncome + taxFreeIncome + (socialSecurityIncome - taxableSocialSecurityIncome);

    return {
      realizedGains,
      capitalLossDeduction,
      section121Exclusion,
      taxDeferredWithdrawals,
      taxableRetirementDistributions,
      taxableDividendIncome,
      taxableInterestIncome,
      earnedIncome,
      socialSecurityIncome,
      taxableSocialSecurityIncome,
      maxTaxableSocialSecurityPercentage,
      provisionalIncome,
      taxFreeIncome,
      grossIncome,
      incomeTaxedAsOrdinary,
      incomeTaxedAsLtcg,
      taxDeductibleContributions,
      adjustedGrossIncome,
      adjustedIncomeTaxedAsOrdinary,
      adjustedIncomeTaxedAsCapGains,
      totalIncome,
      earlyWithdrawals: {
        rothEarnings: earlyRothEarningsWithdrawals,
        '401kAndIra': early401kAndIraWithdrawals,
        hsa: earlyHsaWithdrawals,
      },
    };
  }

  private getRealizedGainsAndCapLossDeductionData(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    annualPhysicalAssetsData: PhysicalAssetsData
  ): {
    realizedGains: number;
    capitalLossDeduction: number;
    section121Exclusion: number;
  } {
    const { section121Exclusion, physicalAssetRealizedGains } = this.getSection121Exclusion(annualPhysicalAssetsData);

    const realizedGainsAfterCarryover =
      annualPortfolioDataBeforeTaxes.realizedGainsForPeriod + physicalAssetRealizedGains + this.capitalLossCarryover;

    if (realizedGainsAfterCarryover >= 0) {
      this.capitalLossCarryover = 0;
      return { realizedGains: realizedGainsAfterCarryover, capitalLossDeduction: 0, section121Exclusion };
    }

    const capitalLossDeduction = -Math.max(-3000, realizedGainsAfterCarryover);
    this.capitalLossCarryover = realizedGainsAfterCarryover + capitalLossDeduction;
    return { realizedGains: 0, capitalLossDeduction, section121Exclusion };
  }

  private processIncomeTaxes({ taxableIncomeTaxedAsOrdinary }: { taxableIncomeTaxedAsOrdinary: number }): {
    incomeTaxAmount: number;
    topMarginalIncomeTaxRate: number;
    incomeTaxBrackets: IncomeTaxBracket[];
  } {
    let incomeTaxAmount = 0;
    let topMarginalIncomeTaxRate = 0;

    const incomeTaxBrackets = this.getIncomeTaxBrackets();
    for (const bracket of incomeTaxBrackets) {
      if (taxableIncomeTaxedAsOrdinary <= bracket.min) break;

      const taxableInBracket = Math.min(taxableIncomeTaxedAsOrdinary, bracket.max) - bracket.min;
      incomeTaxAmount += taxableInBracket * bracket.rate;
      topMarginalIncomeTaxRate = bracket.rate;
    }

    return { incomeTaxAmount, topMarginalIncomeTaxRate, incomeTaxBrackets };
  }

  private processCapitalGainsTaxes({
    taxableIncomeTaxedAsCapGains,
    taxableIncomeTaxedAsOrdinary,
  }: {
    taxableIncomeTaxedAsCapGains: number;
    taxableIncomeTaxedAsOrdinary: number;
  }): {
    capitalGainsTaxAmount: number;
    topMarginalCapitalGainsTaxRate: number;
    capitalGainsTaxBrackets: CapitalGainsTaxBracket[];
  } {
    const totalTaxableIncome = taxableIncomeTaxedAsOrdinary + taxableIncomeTaxedAsCapGains;

    let capitalGainsTaxAmount = 0;
    let topMarginalCapitalGainsTaxRate = 0;

    const capitalGainsTaxBrackets = this.getCapitalGainsTaxBrackets();
    for (const bracket of capitalGainsTaxBrackets) {
      if (totalTaxableIncome <= bracket.min) break;

      const incomeInBracket = Math.min(totalTaxableIncome, bracket.max) - bracket.min;
      const ordinaryIncomeInBracket = Math.max(0, Math.min(taxableIncomeTaxedAsOrdinary, bracket.max) - bracket.min);
      const capitalGainsInBracket = incomeInBracket - ordinaryIncomeInBracket;

      capitalGainsTaxAmount += capitalGainsInBracket * bracket.rate;
      topMarginalCapitalGainsTaxRate = bracket.rate;
    }

    return { capitalGainsTaxAmount, topMarginalCapitalGainsTaxRate, capitalGainsTaxBrackets };
  }

  private processNIIT(incomeData: IncomeSourcesData): NIITData {
    const threshold = NIIT_THRESHOLDS[this.filingStatus];

    const { taxableDividendIncome, taxableInterestIncome, capitalLossDeduction, realizedGains, adjustedGrossIncome } = incomeData;

    const otherInvestmentIncome = Math.max(0, taxableDividendIncome + taxableInterestIncome - capitalLossDeduction);
    const netInvestmentIncome = realizedGains + otherInvestmentIncome;

    const magiOverThreshold = Math.max(0, adjustedGrossIncome - threshold);
    const incomeSubjectToNiit = Math.min(netInvestmentIncome, magiOverThreshold);
    const niitAmount = incomeSubjectToNiit * NIIT_RATE;

    return { netInvestmentIncome, incomeSubjectToNiit, niitAmount, threshold };
  }

  private processEarlyWithdrawalPenalties(earlyWithdrawalsData: IncomeSourcesData['earlyWithdrawals']): EarlyWithdrawalPenaltyData {
    const taxDeferredPenaltyAmount = earlyWithdrawalsData['401kAndIra'] * 0.1 + earlyWithdrawalsData.hsa * 0.2;
    const taxFreePenaltyAmount = earlyWithdrawalsData.rothEarnings * 0.1;

    return { taxDeferredPenaltyAmount, taxFreePenaltyAmount, totalPenaltyAmount: taxDeferredPenaltyAmount + taxFreePenaltyAmount };
  }

  private getTaxablePortionOfSocialSecurityIncome({
    provisionalIncome,
    socialSecurityIncome,
  }: {
    provisionalIncome: number;
    socialSecurityIncome: number;
  }): { taxableSocialSecurityIncome: number; maxTaxableSocialSecurityPercentage: number } {
    const thresholds = this.getSocialSecurityTaxThresholds();

    if (provisionalIncome <= thresholds[0].max) return { taxableSocialSecurityIncome: 0, maxTaxableSocialSecurityPercentage: 0 };

    if (provisionalIncome > thresholds[1].min && provisionalIncome <= thresholds[1].max) {
      const excessIncome = provisionalIncome - thresholds[1].min;
      return {
        taxableSocialSecurityIncome: Math.min(excessIncome * 0.5, socialSecurityIncome * 0.5),
        maxTaxableSocialSecurityPercentage: 0.5,
      };
    }

    const tier1Excess = thresholds[1].max - thresholds[1].min;
    const tier1Amount = Math.min(tier1Excess * 0.5, socialSecurityIncome * 0.5);

    const tier2Excess = provisionalIncome - thresholds[2].min;
    const tier2Amount = tier2Excess * 0.85;

    return {
      taxableSocialSecurityIncome: Math.min(tier1Amount + tier2Amount, socialSecurityIncome * 0.85),
      maxTaxableSocialSecurityPercentage: 0.85,
    };
  }

  private getEmployeeContributionsForAccountTypes(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    accountTypes: AccountInputs['type'][]
  ): number {
    return Object.values(annualPortfolioDataBeforeTaxes.perAccountData)
      .filter((account) => accountTypes.includes(account.type))
      .reduce((sum, account) => sum + (sumTransactions(account.contributionsForPeriod) - account.employerMatchForPeriod), 0);
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

  private getSection121Exclusion(physicalAssetsData: PhysicalAssetsData): {
    section121Exclusion: number;
    physicalAssetRealizedGains: number;
  } {
    const maxExclusion = SECTION_121_EXCLUSION[this.filingStatus];

    // Technically, there should only be one primary residence asset, but just in case...
    const section121Exclusion = Object.values(physicalAssetsData.perAssetData)
      .filter((asset) => asset.assetType === 'primaryResidence' && asset.realizedGains > 0)
      .reduce((total, asset) => total + Math.min(asset.realizedGains, maxExclusion), 0);

    return { section121Exclusion, physicalAssetRealizedGains: physicalAssetsData.totalRealizedGains - section121Exclusion };
  }
}
