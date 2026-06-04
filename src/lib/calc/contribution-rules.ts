/**
 * Contribution rules for investment account funding
 *
 * Enforces IRS contribution limits, employer match calculations, and Mega Backdoor
 * Roth (Section 415(c)) limits. Rules are ranked by priority and applied in order
 * during the portfolio contribution waterfall.
 */

import {
  type ContributionInputs,
  sharedLimitAccounts,
  getAccountTypeLimitKey,
  getAnnualContributionLimit,
  getAnnualSection415cLimit,
  supportsMegaBackdoorRoth,
} from '@/lib/schemas/inputs/contribution-form-schema';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';

import { Account, TaxDeferredAccount } from './account';
import type { IncomesData } from './incomes';

/** Aggregates contributions by account type across all rules for shared IRS limit enforcement */
export class ContributionTracker {
  private employeeByType = new Map<AccountInputs['type'], number>();
  private employerByType = new Map<AccountInputs['type'], number>();
  private employeeByIncome = new Map<string, number>();

  recordContribution(accountType: AccountInputs['type'], employee: number, employer: number, incomeId: string | undefined): void {
    this.employeeByType.set(accountType, (this.employeeByType.get(accountType) ?? 0) + employee);
    this.employerByType.set(accountType, (this.employerByType.get(accountType) ?? 0) + employer);
    if (incomeId) this.employeeByIncome.set(incomeId, (this.employeeByIncome.get(incomeId) ?? 0) + employee);
  }

  getEmployeeByTypes(types: AccountInputs['type'][]): number {
    return types.reduce((sum, t) => sum + (this.employeeByType.get(t) ?? 0), 0);
  }

  getEmployerByTypes(types: AccountInputs['type'][]): number {
    return types.reduce((sum, t) => sum + (this.employerByType.get(t) ?? 0), 0);
  }

  getEmployeeByIncome(incomeId: string): number {
    return this.employeeByIncome.get(incomeId) ?? 0;
  }

  resetYTD(): void {
    this.employeeByType.clear();
    this.employerByType.clear();
    this.employeeByIncome.clear();
  }

  resetMonthly(): void {
    this.employeeByIncome.clear();
  }
}

/** Collection of contribution rules with a base strategy (spend or save surplus) */
export class ContributionRules {
  private readonly contributionRules: ContributionRule[];
  private readonly tracker: ContributionTracker;

  constructor(
    rules: ContributionInputs[],
    private baseRule: { type: 'spend' | 'save' }
  ) {
    this.tracker = new ContributionTracker();
    this.contributionRules = rules.filter((rule) => !rule.disabled).map((rule) => new ContributionRule(rule, this.tracker));
  }

  getRules(): ContributionRule[] {
    return this.contributionRules;
  }

  getBaseRuleType(): 'spend' | 'save' {
    return this.baseRule.type;
  }

  resetYTD(): void {
    this.tracker.resetYTD();
    for (const rule of this.contributionRules) {
      rule.resetYTD();
    }
  }

  resetMonthly(): void {
    this.tracker.resetMonthly();
  }
}

/** A single contribution rule targeting a specific account with amount/limit logic */
export class ContributionRule {
  // Year-to-date employee contribution for this rule
  private ytdEmployeeContribution = 0;
  // Year-to-date employer match for this rule
  private ytdEmployerMatch = 0;

  constructor(
    private contributionInput: ContributionInputs,
    private tracker: ContributionTracker
  ) {}

  /**
   * Calculates the contribution and employer match for this rule
   * @param remainingToContribute - Remaining surplus available for contributions
   * @param account - Target investment account
   * @param age - Current age (for catch-up contribution eligibility)
   * @param incomesData - Income data for income-linked contribution limits
   * @returns Employee contribution and employer match amounts
   */
  calculateContribution(
    remainingToContribute: number,
    account: Account,
    age: number,
    incomesData: IncomesData | null
  ): { contributionAmount: number; employerMatchAmount: number } {
    const remainingToMaxBalance = this.contributionInput.maxBalance
      ? Math.max(0, this.contributionInput.maxBalance - account.getBalance())
      : Infinity;

    const maxContribution = Math.min(
      remainingToMaxBalance,
      remainingToContribute,
      this.calculateRemainingAccountTypeLimit(account, age),
      this.calculateIncomeLimit(incomesData)
    );

    const desiredContribution = this.calculateDesiredContribution(remainingToContribute);

    const contributionAmount = Math.min(desiredContribution, maxContribution);
    const employerMatchAmount = this.calculateEmployerMatch(contributionAmount, incomesData);

    return { contributionAmount, employerMatchAmount };
  }

  /** Records a committed contribution against per-rule YTD counters and the shared tracker */
  recordContribution(employee: number, employer: number, accountType: AccountInputs['type']): void {
    this.ytdEmployeeContribution += employee;
    this.ytdEmployerMatch += employer;
    this.tracker.recordContribution(accountType, employee, employer, this.contributionInput.incomeId);
  }

  resetYTD(): void {
    this.ytdEmployeeContribution = 0;
    this.ytdEmployerMatch = 0;
  }

  getAccountID(): string {
    return this.contributionInput.accountId;
  }

  getRank(): number {
    return this.contributionInput.rank;
  }

  private calculateIncomeLimit(incomesData: IncomesData | null): number {
    const incomeId = this.contributionInput.incomeId;
    if (!incomeId) return Infinity;
    return Math.max(0, (incomesData?.perIncomeData?.[incomeId]?.income ?? 0) - this.tracker.getEmployeeByIncome(incomeId));
  }

  private calculateEmployerMatch(contributionAmount: number, incomesData: IncomesData | null): number {
    const matchRate = this.contributionInput.employerMatchRate ?? 100;

    if (this.contributionInput.employerMatchType === 'percentOfIncome') {
      if (!this.contributionInput.employerMatchPercent) return 0;

      let baseMonthlyIncome = 0;
      const incomeId = this.contributionInput.incomeId;
      if (incomeId) {
        baseMonthlyIncome = incomesData?.perIncomeData?.[incomeId]?.income ?? 0;
      } else {
        baseMonthlyIncome = incomesData?.totalIncome ?? 0;
      }

      // employerMatchPercent is the annual max employer match as % of salary.
      // employerMatchRate is only applied to the contribution side (e.g., 50% match on your contributions).
      // Since incomesData is monthly, annualize it to compute the correct cap.
      // YTD tracking ensures multi-month contributions don't exceed the annual limit.
      const annualMaxEmployerMatch = (this.contributionInput.employerMatchPercent / 100) * baseMonthlyIncome * 12;

      const remainingAnnualMatch = Math.max(0, annualMaxEmployerMatch - this.ytdEmployerMatch);
      const matchOnThisContribution = (matchRate / 100) * contributionAmount;
      return Math.min(matchOnThisContribution, remainingAnnualMatch);
    } else {
      if (!this.contributionInput.employerMatch) return 0;

      const remainingToMaxEmployerMatch = Math.max(0, this.contributionInput.employerMatch - this.ytdEmployerMatch);

      const matchAtRate = (matchRate / 100) * contributionAmount;
      return Math.min(matchAtRate, remainingToMaxEmployerMatch);
    }
  }

  private calculateDesiredContribution(remainingToContribute: number): number {
    switch (this.contributionInput.contributionType) {
      case 'dollarAmount':
        return Math.max(0, this.contributionInput.dollarAmount - this.ytdEmployeeContribution);
      case 'percentRemaining':
        return remainingToContribute * (this.contributionInput.percentRemaining / 100);
      case 'unlimited':
        return Infinity;
    }
  }

  private calculateRemainingAccountTypeLimit(account: Account, age: number): number {
    const accountType = account.getAccountType();

    const accountTypeGroup = sharedLimitAccounts[accountType];
    if (!accountTypeGroup) return Infinity;

    if (this.contributionInput.enableMegaBackdoorRoth && supportsMegaBackdoorRoth(accountType)) {
      const employeeContributionsSoFar = this.tracker.getEmployeeByTypes(accountTypeGroup);
      const employerMatchSoFar = this.tracker.getEmployerByTypes(accountTypeGroup);

      const totalContributionsSoFar = employeeContributionsSoFar + employerMatchSoFar;

      return Math.max(0, getAnnualSection415cLimit(age) - totalContributionsSoFar);
    }

    // Get HSA coverage type for HSA account limit calculation
    const hsaCoverageType =
      accountType === 'hsa' && account instanceof TaxDeferredAccount
        ? account.getHsaCoverageType()
        : undefined;

    const limit = getAnnualContributionLimit(getAccountTypeLimitKey(accountType), age, hsaCoverageType);
    if (!Number.isFinite(limit)) return Infinity;

    const employeeContributionsSoFar = this.tracker.getEmployeeByTypes(accountTypeGroup);
    return Math.max(0, limit - employeeContributionsSoFar);
  }
}
