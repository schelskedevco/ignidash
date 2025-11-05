import {
  type ContributionInputs,
  sharedLimitAccounts,
  getAccountTypeLimitKey,
  getAnnualContributionLimit,
} from '@/lib/schemas/inputs/contribution-form-schema';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';

import type { PortfolioData } from './portfolio';
import { Account } from './account';
import type { IncomesData } from './incomes';

export class ContributionRules {
  private readonly contributionRules: ContributionRule[];

  constructor(
    rules: ContributionInputs[],
    private baseRule: { type: 'spend' | 'save' }
  ) {
    this.contributionRules = rules.filter((rule) => !rule.disabled).map((rule) => new ContributionRule(rule));
  }

  getRules(): ContributionRule[] {
    return this.contributionRules;
  }

  getBaseRuleType(): 'spend' | 'save' {
    return this.baseRule.type;
  }
}

export class ContributionRule {
  constructor(private contributionInput: ContributionInputs) {}

  getContributionAmount(
    remainingToContribute: number,
    account: Account,
    monthlyPortfolioData: PortfolioData[],
    age: number,
    incomesData?: IncomesData
  ): { contributionAmount: number; employerMatchAmount: number } {
    const currentBalance = account.getBalance();
    const maxBalance = this.contributionInput.maxBalance;

    const remainingToMaxBalance = maxBalance ? Math.max(0, maxBalance - currentBalance) : Infinity;
    const remainingToAccountTypeContributionLimit = this.getRemainingToAccountTypeContributionLimit(account, monthlyPortfolioData, age);
    let maxContribution = Math.min(remainingToMaxBalance, remainingToContribute, remainingToAccountTypeContributionLimit);

    const eligibleIncomeIds = new Set(this.contributionInput?.incomeIds);
    if (eligibleIncomeIds.size > 0) {
      const eligibleIncomes = Object.values(incomesData?.perIncomeData || {}).filter((income) => eligibleIncomeIds.has(income.id));
      const totalEligibleGrossIncome = eligibleIncomes.reduce((sum, income) => sum + income.grossIncome, 0);

      maxContribution = Math.min(maxContribution, totalEligibleGrossIncome);
    }

    const contributionsSoFar = this.getPersonalContributionsSoFarByAccountID(monthlyPortfolioData, account.getAccountID());

    const desiredContribution = this.calculateDesiredContribution(remainingToContribute, contributionsSoFar);
    const contributionAmount = Math.min(desiredContribution, maxContribution);

    let employerMatchAmount: number = 0;
    if (this.contributionInput.employerMatch) {
      const employerMatchSoFar = this.getEmployerMatchSoFarByAccountID(monthlyPortfolioData, account.getAccountID());
      const remainingToMaxEmployerMatch = Math.max(0, this.contributionInput.employerMatch - employerMatchSoFar);
      employerMatchAmount = Math.min(contributionAmount, remainingToMaxEmployerMatch);
    }

    return { contributionAmount, employerMatchAmount };
  }

  getAccountID(): string {
    return this.contributionInput.accountId;
  }

  getRank(): number {
    return this.contributionInput.rank;
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

  private getRemainingToAccountTypeContributionLimit(account: Account, monthlyPortfolioData: PortfolioData[], age: number): number {
    const accountType = account.getAccountType();

    const accountTypeGroup = sharedLimitAccounts[accountType];
    if (!accountTypeGroup) return Infinity;

    const limit = getAnnualContributionLimit(getAccountTypeLimitKey(accountType), age);
    if (!Number.isFinite(limit)) return Infinity;

    const contributionsSoFar = this.getPersonalContributionsSoFarByAccountTypes(monthlyPortfolioData, accountTypeGroup);
    return Math.max(0, limit - contributionsSoFar);
  }

  private getPersonalContributionsSoFarByAccountTypes(
    monthlyPortfolioData: PortfolioData[],
    accountTypes: AccountInputs['type'][]
  ): number {
    return monthlyPortfolioData
      .flatMap((data) => Object.values(data.perAccountData))
      .filter((account) => accountTypes.includes(account.type))
      .reduce((sum, account) => sum + (account.contributionsForPeriod - account.employerMatchForPeriod), 0);
  }

  private getPersonalContributionsSoFarByAccountID(monthlyPortfolioData: PortfolioData[], accountID: string): number {
    return monthlyPortfolioData
      .flatMap((data) => Object.values(data.perAccountData))
      .filter((account) => account.id === accountID)
      .reduce((sum, account) => sum + (account.contributionsForPeriod - account.employerMatchForPeriod), 0);
  }

  private getEmployerMatchSoFarByAccountID(monthlyPortfolioData: PortfolioData[], accountID: string): number {
    return monthlyPortfolioData
      .flatMap((data) => Object.values(data.perAccountData))
      .filter((account) => account.id === accountID)
      .reduce((sum, account) => sum + (account.employerMatchForPeriod || 0), 0);
  }
}
