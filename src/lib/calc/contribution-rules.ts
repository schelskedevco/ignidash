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

import { Account } from './account';
import type { IncomesData } from './incomes';

/** Aggregates contributions by account type across all rules for shared IRS limit enforcement */
export class ContributionTracker {
  private employeeByType = new Map<AccountInputs['type'], number>();
  private employerByType = new Map<AccountInputs['type'], number>();

  recordContribution(accountType: AccountInputs['type'], employee: number, employer: number): void {
    this.employeeByType.set(accountType, (this.employeeByType.get(accountType) ?? 0) + employee);
    this.employerByType.set(accountType, (this.employerByType.get(accountType) ?? 0) + employer);
  }

  getEmployeeByTypes(types: AccountInputs['type'][]): number {
    return types.reduce((sum, t) => sum + (this.employeeByType.get(t) ?? 0), 0);
  }

  getEmployerByTypes(types: AccountInputs['type'][]): number {
    return types.reduce((sum, t) => sum + (this.employerByType.get(t) ?? 0), 0);
  }

  reset(): void {
    this.employeeByType.clear();
    this.employerByType.clear();
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
    this.tracker.reset();
    for (const rule of this.contributionRules) {
      rule.resetYTD();
    }
  }
}

/** A single contribution rule targeting a specific account with amount/limit logic */
export class ContributionRule {
  private ytdEmployeeContribution = 0;
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
    incomesData?: IncomesData
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

    const desiredContribution = this.calculateDesiredContribution(remainingToContribute, this.ytdEmployeeContribution);

    const contributionAmount = Math.min(desiredContribution, maxContribution);
    const employerMatchAmount = this.calculateEmployerMatch(contributionAmount);

    return { contributionAmount, employerMatchAmount };
  }

  /** Records a committed contribution against per-rule YTD counters and the shared tracker */
  recordContribution(employee: number, employer: number, accountType: AccountInputs['type']): void {
    this.ytdEmployeeContribution += employee;
    this.ytdEmployerMatch += employer;
    this.tracker.recordContribution(accountType, employee, employer);
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

  private calculateIncomeLimit(incomesData?: IncomesData): number {
    const eligibleIncomeIds = new Set(this.contributionInput?.incomeIds);
    if (eligibleIncomeIds.size === 0) return Infinity;

    return Object.values(incomesData?.perIncomeData ?? {})
      .filter((income) => eligibleIncomeIds.has(income.id))
      .reduce((sum, income) => sum + income.income, 0);
  }

  private calculateEmployerMatch(contributionAmount: number): number {
    if (!this.contributionInput.employerMatch) return 0;

    const remainingToMaxEmployerMatch = Math.max(0, this.contributionInput.employerMatch - this.ytdEmployerMatch);

    return Math.min(contributionAmount, remainingToMaxEmployerMatch);
  }

  private calculateDesiredContribution(remainingToContribute: number, contributionsSoFar: number): number {
    switch (this.contributionInput.contributionType) {
      case 'dollarAmount':
        return Math.max(0, this.contributionInput.dollarAmount - contributionsSoFar);
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

    const limit = getAnnualContributionLimit(getAccountTypeLimitKey(accountType), age);
    if (!Number.isFinite(limit)) return Infinity;

    const employeeContributionsSoFar = this.tracker.getEmployeeByTypes(accountTypeGroup);
    return Math.max(0, limit - employeeContributionsSoFar);
  }
}
