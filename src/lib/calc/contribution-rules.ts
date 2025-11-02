import type { ContributionInputs } from '@/lib/schemas/contribution-form-schema';
import type { AccountInputs } from '@/lib/schemas/account-form-schema';

import type { PortfolioData } from './portfolio';
import { Account } from './account';
import type { IncomesData } from './incomes';

export class ContributionRules {
  private readonly contributionRules: ContributionRule[];

  constructor(
    rules: ContributionInputs[],
    private baseRule: { type: 'spend' | 'save' }
  ) {
    this.contributionRules = rules.map((rule) => new ContributionRule(rule));
  }

  getRules(): ContributionRule[] {
    return this.contributionRules;
  }

  getBaseRuleType(): 'spend' | 'save' {
    return this.baseRule.type;
  }
}

export class ContributionRule {
  private static readonly ACCOUNT_TYPE_GROUPS: Record<string, AccountInputs['type'][]> = {
    '401k': ['401k', 'roth401k'],
    roth401k: ['401k', 'roth401k'],
    ira: ['ira', 'rothIra'],
    rothIra: ['ira', 'rothIra'],
    hsa: ['hsa'],
  };

  constructor(private contributionInput: ContributionInputs) {}

  getContributionAmount(
    remainingToContribute: number,
    account: Account,
    monthlyPortfolioData: PortfolioData[],
    age: number,
    incomesData?: IncomesData
  ): number {
    const currentAccountValue = account.getTotalValue();

    const remainingToMaxAccountValue = this.contributionInput.maxValue ? this.contributionInput.maxValue - currentAccountValue : Infinity;
    const remainingToAccountTypeContributionLimit = this.getRemainingToAccountTypeContributionLimit(account, monthlyPortfolioData, age);
    let maxContribution = Math.min(remainingToMaxAccountValue, remainingToContribute, remainingToAccountTypeContributionLimit);

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

    const accountTypeGroup = ContributionRule.ACCOUNT_TYPE_GROUPS[accountType];
    if (!accountTypeGroup) return Infinity;

    const limit = this.getAnnualLimit(this.getLimitKey(accountType), age);
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

  private getLimitKey(accountType: AccountInputs['type']): string {
    switch (accountType) {
      case '401k':
      case 'roth401k':
        return '401kCombined';
      case 'ira':
      case 'rothIra':
        return 'iraCombined';
      default:
        return accountType;
    }
  }

  private getAnnualLimit(limitKey: string, age: number): number {
    switch (limitKey) {
      case '401kCombined':
        return age < 50 ? 23500 : 31000;
      case 'iraCombined':
        return age < 50 ? 7000 : 8000;
      case 'hsa':
        return age < 55 ? 4300 : 5300;
      default:
        return Infinity;
    }
  }
}
