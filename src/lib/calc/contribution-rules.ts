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
  ): number {
    const currentBalance = account.getBalance();

    const remainingToMaxBalance = this.contributionInput.maxBalance ? this.contributionInput.maxBalance - currentBalance : Infinity;
    const remainingToAccountTypeContributionLimit = this.getRemainingToAccountTypeContributionLimit(account, monthlyPortfolioData, age);
    let maxContribution = Math.min(remainingToMaxBalance, remainingToContribute, remainingToAccountTypeContributionLimit);

    const eligibleIncomeIds = new Set(this.contributionInput?.incomeIds);
    if (eligibleIncomeIds.size > 0) {
      const eligibleIncomes = Object.values(incomesData?.perIncomeData || {}).filter((income) => eligibleIncomeIds.has(income.id));
      const totalEligibleGrossIncome = eligibleIncomes.reduce((sum, income) => sum + income.grossIncome, 0);

      maxContribution = Math.min(maxContribution, totalEligibleGrossIncome);
    }

    let contributionAmount;
    switch (this.contributionInput.contributionType) {
      case 'dollarAmount':
        contributionAmount = this.contributionInput.dollarAmount;
        return Math.min(contributionAmount, maxContribution);
      case 'percentRemaining':
        contributionAmount = remainingToContribute * (this.contributionInput.percentRemaining / 100);
        return Math.min(contributionAmount, maxContribution);
      case 'unlimited':
        return maxContribution;
    }
  }

  getAccountID(): string {
    return this.contributionInput.accountId;
  }

  getRank(): number {
    return this.contributionInput.rank;
  }

  private getRemainingToAccountTypeContributionLimit(account: Account, monthlyPortfolioData: PortfolioData[], age: number): number {
    const accountType = account.getAccountType();

    const accountTypeGroup = sharedLimitAccounts[accountType];
    if (!accountTypeGroup) return Infinity;

    const limit = getAnnualContributionLimit(getAccountTypeLimitKey(accountType), age);
    if (!Number.isFinite(limit)) return Infinity;

    const contributions = this.getContributionsSoFar(monthlyPortfolioData, accountTypeGroup);
    return Math.max(0, limit - contributions);
  }

  private getContributionsSoFar(monthlyPortfolioData: PortfolioData[], accountTypes: AccountInputs['type'][]): number {
    return monthlyPortfolioData
      .flatMap((data) => Object.values(data.perAccountData))
      .filter((account) => accountTypes.includes(account.type))
      .reduce((sum, account) => sum + account.contributionsForPeriod, 0);
  }
}
