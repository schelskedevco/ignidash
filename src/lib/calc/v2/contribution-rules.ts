import type { ContributionInputs } from '@/lib/schemas/contribution-form-schema';
import type { AccountInputs } from '@/lib/schemas/account-form-schema';

import type { SimulationState } from './simulation-engine';
import type { Account } from './portfolio';
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
  constructor(private contributionInput: ContributionInputs) {}

  canApply(): boolean {
    return true;
  }

  getContributionAmount(
    cashLeftToAllocate: number,
    remainingContributionLimit: number,
    account: Account,
    incomesData: IncomesData
  ): number {
    const currentAccountValue = account.getTotalValue();

    const remainingToMaxAccountValue = this.contributionInput.maxValue ? this.contributionInput.maxValue - currentAccountValue : Infinity;
    let maxContribution = Math.min(remainingToMaxAccountValue, cashLeftToAllocate, remainingContributionLimit);

    const eligibleIncomeIds = new Set(this.contributionInput?.incomeIds);
    if (eligibleIncomeIds.size > 0) {
      const eligibleIncomes = Object.values(incomesData.perIncomeData).filter((income) => eligibleIncomeIds.has(income.id));
      const totalEligibleGrossIncome = eligibleIncomes.reduce((sum, income) => sum + income.grossIncome, 0);

      maxContribution = Math.min(maxContribution, totalEligibleGrossIncome);
    }

    let contributionAmount;
    switch (this.contributionInput.contributionType) {
      case 'dollarAmount':
        contributionAmount = this.contributionInput.dollarAmount;
        return Math.min(contributionAmount, maxContribution);
      case 'percentRemaining':
        contributionAmount = cashLeftToAllocate * (this.contributionInput.percentRemaining / 100);
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
}

export class AnnualContributionTracker {
  private ytdContributions: Map<string, number> = new Map();
  private lastYear: number;

  constructor(private simulationState: SimulationState) {
    this.lastYear = this.simulationState.time.year;
  }

  addContribution(accountType: AccountInputs['type'], amount: number): void {
    const limitKey = this.getLimitKey(accountType);

    const currentYtdContribution = this.ytdContributions.get(limitKey) || 0;
    this.ytdContributions.set(limitKey, currentYtdContribution + amount);
  }

  getRemainingLimit(accountType: AccountInputs['type']): number {
    const currentYear = Math.floor(this.simulationState.time.year);
    if (currentYear !== this.lastYear) {
      this.resetYtdContributions();
      this.lastYear = currentYear;
    }

    const limitKey = this.getLimitKey(accountType);

    const annualLimit = this.getAnnualLimit(limitKey);
    const ytdContribution = this.getYtdContributions(accountType);

    return Math.max(0, annualLimit - ytdContribution);
  }

  private getYtdContributions(accountType: AccountInputs['type']): number {
    const limitKey = this.getLimitKey(accountType);
    return this.ytdContributions.get(limitKey) || 0;
  }

  private resetYtdContributions(): void {
    this.ytdContributions.clear();
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

  private getAnnualLimit(limitKey: string): number {
    const age = this.simulationState.time.age;

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
