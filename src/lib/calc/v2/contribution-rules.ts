import type { ContributionInputs } from '@/lib/schemas/contribution-form-schema';

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

  getContributionAmount(cashLeftToAllocate: number): number {
    return cashLeftToAllocate;
  }

  getAccountID(): string {
    return this.contributionInput.accountId;
  }
}
