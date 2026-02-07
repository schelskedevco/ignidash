import {
  type ContributionInputs,
  sharedLimitAccounts,
  getAccountTypeLimitKey,
  getAnnualContributionLimit,
  getAnnualSection415cLimit,
} from '@/lib/schemas/inputs/contribution-form-schema';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';

import type { PortfolioData } from './portfolio';
import { Account } from './account';
import type { IncomesData } from './incomes';
import { sumTransactions } from './asset';

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
      const totalEligibleIncome = eligibleIncomes.reduce((sum, income) => sum + income.income, 0);

      maxContribution = Math.min(maxContribution, totalEligibleIncome);
    }

    const employeeContributionsSoFar = this.getEmployeeContributionsSoFarByAccountID(monthlyPortfolioData, account.getAccountID());

    const desiredContribution = this.calculateDesiredContribution(remainingToContribute, employeeContributionsSoFar);
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

    if (this.contributionInput.enableMegaBackdoorRoth) {
      const employeeContributionsSoFar = this.getEmployeeContributionsSoFarByAccountTypes(monthlyPortfolioData, accountTypeGroup);
      const employerMatchSoFar = this.getEmployerMatchSoFarByAccountTypes(monthlyPortfolioData, accountTypeGroup);

      const totalContributionsSoFar = employeeContributionsSoFar + employerMatchSoFar;

      return Math.max(0, getAnnualSection415cLimit(age) - totalContributionsSoFar);
    }

    const limit = getAnnualContributionLimit(getAccountTypeLimitKey(accountType), age);
    if (!Number.isFinite(limit)) return Infinity;

    const employeeContributionsSoFar = this.getEmployeeContributionsSoFarByAccountTypes(monthlyPortfolioData, accountTypeGroup);
    return Math.max(0, limit - employeeContributionsSoFar);
  }

  private getEmployeeContributionsSoFarByAccountTypes(
    monthlyPortfolioData: PortfolioData[],
    accountTypes: AccountInputs['type'][]
  ): number {
    return monthlyPortfolioData
      .flatMap((data) => Object.values(data.perAccountData))
      .filter((account) => accountTypes.includes(account.type))
      .reduce((sum, account) => sum + (sumTransactions(account.contributionsForPeriod) - account.employerMatchForPeriod), 0);
  }

  private getEmployerMatchSoFarByAccountTypes(monthlyPortfolioData: PortfolioData[], accountTypes: AccountInputs['type'][]): number {
    return monthlyPortfolioData
      .flatMap((data) => Object.values(data.perAccountData))
      .filter((account) => accountTypes.includes(account.type))
      .reduce((sum, account) => sum + account.employerMatchForPeriod, 0);
  }

  private getEmployeeContributionsSoFarByAccountID(monthlyPortfolioData: PortfolioData[], accountID: string): number {
    return monthlyPortfolioData
      .flatMap((data) => Object.values(data.perAccountData))
      .filter((account) => account.id === accountID)
      .reduce((sum, account) => sum + (sumTransactions(account.contributionsForPeriod) - account.employerMatchForPeriod), 0);
  }

  private getEmployerMatchSoFarByAccountID(monthlyPortfolioData: PortfolioData[], accountID: string): number {
    return monthlyPortfolioData
      .flatMap((data) => Object.values(data.perAccountData))
      .filter((account) => account.id === accountID)
      .reduce((sum, account) => sum + account.employerMatchForPeriod, 0);
  }
}
