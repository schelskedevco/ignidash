import { describe, it, expect } from 'vitest';

import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { ContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import {
  getAnnualContributionLimit,
  getAnnualSection415cLimit,
  sharedLimitAccounts,
  supportsMegaBackdoorRoth,
} from '@/lib/schemas/inputs/contribution-form-schema';

import { ContributionRules, ContributionRule, ContributionTracker } from './contribution-rules';
import { TaxDeferredAccount, TaxFreeAccount, SavingsAccount } from './account';
import type { IncomesData } from './incomes';

// ============================================================================
// Test Fixtures
// ============================================================================

const create401kAccount = (overrides?: Partial<AccountInputs & { type: '401k' }>): AccountInputs & { type: '401k' } => ({
  type: '401k',
  id: overrides?.id ?? '401k-1',
  name: overrides?.name ?? '401k Account',
  balance: overrides?.balance ?? 100000,
  percentBonds: overrides?.percentBonds ?? 20,
});

const createRothIraAccount = (overrides?: Partial<AccountInputs & { type: 'rothIra' }>): AccountInputs & { type: 'rothIra' } => ({
  type: 'rothIra',
  id: overrides?.id ?? 'roth-ira-1',
  name: overrides?.name ?? 'Roth IRA',
  balance: overrides?.balance ?? 50000,
  percentBonds: overrides?.percentBonds ?? 10,
  contributionBasis: overrides?.contributionBasis ?? 40000,
});

const createRoth401kAccount = (overrides?: Partial<AccountInputs & { type: 'roth401k' }>): AccountInputs & { type: 'roth401k' } => ({
  type: 'roth401k',
  id: overrides?.id ?? 'roth401k-1',
  name: overrides?.name ?? 'Roth 401k',
  balance: overrides?.balance ?? 50000,
  percentBonds: overrides?.percentBonds ?? 20,
  contributionBasis: overrides?.contributionBasis ?? 50000,
});

const createRoth403bAccount = (overrides?: Partial<AccountInputs & { type: 'roth403b' }>): AccountInputs & { type: 'roth403b' } => ({
  type: 'roth403b',
  id: overrides?.id ?? 'roth403b-1',
  name: overrides?.name ?? 'Roth 403b',
  balance: overrides?.balance ?? 30000,
  percentBonds: overrides?.percentBonds ?? 15,
  contributionBasis: overrides?.contributionBasis ?? 30000,
});

const createSavingsAccountInput = (overrides?: Partial<AccountInputs & { type: 'savings' }>): AccountInputs & { type: 'savings' } => ({
  type: 'savings',
  id: overrides?.id ?? 'savings-1',
  name: overrides?.name ?? 'Savings Account',
  balance: overrides?.balance ?? 10000,
});

// Factory function that creates properly typed contribution rules based on contributionType
const createContributionRule = (
  overrides?: Partial<Omit<ContributionInputs, 'contributionType'>> & {
    contributionType?: ContributionInputs['contributionType'];
    dollarAmount?: number;
    percentRemaining?: number;
    enableMegaBackdoorRoth?: boolean;
  }
): ContributionInputs => {
  const base = {
    id: overrides?.id ?? 'rule-1',
    accountId: overrides?.accountId ?? '401k-1',
    rank: overrides?.rank ?? 1,
    disabled: overrides?.disabled ?? false,
    employerMatch: overrides?.employerMatch,
    maxBalance: overrides?.maxBalance,
    incomeIds: overrides?.incomeIds,
    enableMegaBackdoorRoth: overrides?.enableMegaBackdoorRoth,
  };

  const contributionType = overrides?.contributionType ?? 'unlimited';

  if (contributionType === 'dollarAmount') {
    return {
      ...base,
      contributionType: 'dollarAmount',
      dollarAmount: overrides?.dollarAmount ?? 1000,
    };
  }

  if (contributionType === 'percentRemaining') {
    return {
      ...base,
      contributionType: 'percentRemaining',
      percentRemaining: overrides?.percentRemaining ?? 50,
    };
  }

  return {
    ...base,
    contributionType: 'unlimited',
  };
};

const createEmptyIncomesData = (overrides?: Partial<IncomesData>): IncomesData => ({
  totalIncome: overrides?.totalIncome ?? 0,
  totalAmountWithheld: overrides?.totalAmountWithheld ?? 0,
  totalFicaTax: overrides?.totalFicaTax ?? 0,
  totalIncomeAfterPayrollDeductions: overrides?.totalIncomeAfterPayrollDeductions ?? 0,
  totalTaxFreeIncome: overrides?.totalTaxFreeIncome ?? 0,
  totalSocialSecurityIncome: overrides?.totalSocialSecurityIncome ?? 0,
  perIncomeData: overrides?.perIncomeData ?? {},
});

// ============================================================================
// Contribution Type Tests
// ============================================================================

describe('ContributionRules', () => {
  describe('contribution types', () => {
    describe('dollarAmount type', () => {
      it('should contribute fixed dollar amount per period', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 1000,
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.calculateContribution(5000, account, 35);

        expect(result.contributionAmount).toBe(1000);
      });

      it('should not exceed remaining cash when dollar amount is higher', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 10000,
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.calculateContribution(5000, account, 35);

        expect(result.contributionAmount).toBe(5000);
      });

      it('should return 0 when dollarAmount is fully exhausted by prior contributions', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 2000,
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        // Prior employee contributions: 2000 (fully exhausted)
        rule.recordContribution(2000, 0, '401k');

        const result = rule.calculateContribution(5000, account, 35);

        expect(result.contributionAmount).toBe(0);
      });

      it('should track contributions so far and only contribute remaining', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 2000,
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        // First month: contribute 500
        rule.recordContribution(500, 0, '401k');

        // Second month: should only contribute remaining 1500
        const result = rule.calculateContribution(5000, account, 35);

        expect(result.contributionAmount).toBe(1500);
      });
    });

    describe('percentRemaining type', () => {
      it('should contribute percentage of remaining cash', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'percentRemaining',
            percentRemaining: 50,
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.calculateContribution(4000, account, 35);

        expect(result.contributionAmount).toBe(2000); // 50% of 4000
      });

      it('should handle 100% of remaining', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'percentRemaining',
            percentRemaining: 100,
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.calculateContribution(5000, account, 35);

        expect(result.contributionAmount).toBe(5000);
      });
    });

    describe('zero remaining cash', () => {
      it('should contribute 0 when no remaining cash is available (dollarAmount)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 5000,
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.calculateContribution(0, account, 35);

        expect(result.contributionAmount).toBe(0);
        expect(result.employerMatchAmount).toBe(0);
      });

      it('should contribute 0 when no remaining cash is available (unlimited with employer match)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: '401k-1',
            employerMatch: 5000,
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.calculateContribution(0, account, 35);

        expect(result.contributionAmount).toBe(0);
        expect(result.employerMatchAmount).toBe(0);
      });
    });

    describe('unlimited type', () => {
      it('should contribute all remaining cash', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.calculateContribution(7500, account, 35);

        expect(result.contributionAmount).toBe(7500);
      });
    });
  });

  // ============================================================================
  // Contribution Limit Tests
  // ============================================================================

  describe('contribution limit enforcement', () => {
    describe('401k/403b limits', () => {
      it('should enforce $24,500 limit for age under 50', () => {
        expect(getAnnualContributionLimit('401kCombined', 35)).toBe(24500);
        expect(getAnnualContributionLimit('401kCombined', 49)).toBe(24500);
      });

      it('should enforce $32,500 limit for age 50+', () => {
        expect(getAnnualContributionLimit('401kCombined', 50)).toBe(32500);
        expect(getAnnualContributionLimit('401kCombined', 65)).toBe(32500);
      });

      it('should enforce $35,750 super catch-up for ages 60-63', () => {
        expect(getAnnualContributionLimit('401kCombined', 60)).toBe(35750);
        expect(getAnnualContributionLimit('401kCombined', 63)).toBe(35750);
      });

      it('should fall back to $32,500 at age 64', () => {
        expect(getAnnualContributionLimit('401kCombined', 64)).toBe(32500);
      });

      it('should share limit between 401k and 403b', () => {
        expect(sharedLimitAccounts['401k']).toContain('403b');
        expect(sharedLimitAccounts['403b']).toContain('401k');
        expect(sharedLimitAccounts['401k']).toContain('roth401k');
        expect(sharedLimitAccounts['roth401k']).toContain('401k');
      });

      it('should limit contribution based on annual limit', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        // Previous contributions of 20,000 in the year
        rule.recordContribution(20000, 0, '401k');

        // At age 35, limit is 24,500. Already contributed 20k, so max is 4,500
        const result = rule.calculateContribution(10000, account, 35);

        expect(result.contributionAmount).toBe(4500);
      });

      it('should enforce $32,500 catch-up limit at age 50 in calculateContribution (integration)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: '401k-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        // No prior contributions, age 50, remaining cash 50000
        const result = rule.calculateContribution(50000, account, 50);

        expect(result.contributionAmount).toBe(32500);
      });
    });

    describe('IRA limits', () => {
      it('should enforce $7,500 limit for age under 50', () => {
        expect(getAnnualContributionLimit('iraCombined', 35)).toBe(7500);
        expect(getAnnualContributionLimit('iraCombined', 49)).toBe(7500);
      });

      it('should enforce $8,600 limit for age 50+', () => {
        expect(getAnnualContributionLimit('iraCombined', 50)).toBe(8600);
        expect(getAnnualContributionLimit('iraCombined', 65)).toBe(8600);
      });

      it('should share limit between traditional IRA and Roth IRA', () => {
        expect(sharedLimitAccounts['ira']).toContain('rothIra');
        expect(sharedLimitAccounts['rothIra']).toContain('ira');
      });

      it('should enforce $8,600 catch-up IRA limit at age 55 in calculateContribution (integration)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth-ira-1',
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRothIraAccount());

        // No prior contributions, age 55, remaining cash 20000
        const result = rule.calculateContribution(20000, account, 55);

        expect(result.contributionAmount).toBe(8600);
      });
    });

    // IRS deviation: these limits use self-only coverage ($4,400). IRS Notice 2025-67
    // also defines $8,750 for family coverage, which the engine does not model.
    describe('HSA limits', () => {
      it('should enforce $4,400 limit for age under 55', () => {
        expect(getAnnualContributionLimit('hsa', 35)).toBe(4400);
        expect(getAnnualContributionLimit('hsa', 54)).toBe(4400);
      });

      it('should enforce $5,400 limit for age 55+', () => {
        expect(getAnnualContributionLimit('hsa', 55)).toBe(5400);
        expect(getAnnualContributionLimit('hsa', 65)).toBe(5400);
      });

      it('should enforce $4,400 HSA limit in calculateContribution (integration)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'hsa-1',
          }),
          tracker
        );
        const account = new TaxDeferredAccount({
          type: 'hsa',
          id: 'hsa-1',
          name: 'HSA',
          balance: 5000,
          percentBonds: 10,
        });

        // Prior HSA contributions: 3000
        rule.recordContribution(3000, 0, 'hsa');

        // HSA limit at age 35 = 4400, already contributed 3000 → 1400 remaining
        const result = rule.calculateContribution(10000, account, 35);

        expect(result.contributionAmount).toBe(1400);
      });
    });

    describe('accounts without limits', () => {
      it('should return Infinity for taxable brokerage', () => {
        expect(getAnnualContributionLimit('taxableBrokerage', 35)).toBe(Infinity);
      });

      it('should return Infinity for savings', () => {
        expect(getAnnualContributionLimit('savings', 35)).toBe(Infinity);
      });
    });
  });

  // ============================================================================
  // Employer Matching Tests
  // ============================================================================

  describe('employer matching', () => {
    it('should add employer match up to configured amount', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 5000,
          accountId: '401k-1',
          employerMatch: 2500,
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const result = rule.calculateContribution(10000, account, 35);

      expect(result.contributionAmount).toBe(5000);
      expect(result.employerMatchAmount).toBe(2500);
    });

    it('should not exceed employee contribution for employer match', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 1000,
          accountId: '401k-1',
          employerMatch: 5000, // Higher than contribution
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const result = rule.calculateContribution(10000, account, 35);

      expect(result.contributionAmount).toBe(1000);
      expect(result.employerMatchAmount).toBe(1000); // Limited to employee contribution
    });

    it('should calculate employer match based on percentRemaining contribution', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'percentRemaining',
          percentRemaining: 50,
          accountId: '401k-1',
          employerMatch: 3000,
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const result = rule.calculateContribution(6000, account, 35);

      expect(result.contributionAmount).toBe(3000); // 50% of 6000
      expect(result.employerMatchAmount).toBe(3000); // min(3000 contribution, 3000 match cap)
    });

    it('should calculate employer match based on unlimited contribution', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: '401k-1',
          employerMatch: 2000,
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const result = rule.calculateContribution(5000, account, 35);

      expect(result.contributionAmount).toBe(5000); // unlimited takes all remaining
      expect(result.employerMatchAmount).toBe(2000); // min(5000 contribution, 2000 match cap)
    });

    it('should track employer match separately from employee contributions', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 2000,
          accountId: '401k-1',
          employerMatch: 1500,
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      // Previous: 1000 employee + 1000 employer match
      rule.recordContribution(1000, 1000, '401k');

      const result = rule.calculateContribution(5000, account, 35);

      // Employee contributes remaining 1000 (2000 - 1000 already contributed)
      expect(result.contributionAmount).toBe(1000);
      // Employer match remaining is 500 (1500 - 1000 already matched)
      expect(result.employerMatchAmount).toBe(500);
    });

    it('should return 0 employer match when annual match is fully exhausted', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 5000,
          accountId: '401k-1',
          employerMatch: 2000,
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      // Prior: 1000 employee + 2000 employer match
      rule.recordContribution(1000, 2000, '401k');

      const result = rule.calculateContribution(10000, account, 35);

      // Employee: dollarAmount=5000, 1000 contributed so far → 4000 remaining
      expect(result.contributionAmount).toBe(4000);
      // Employer: match=2000, 2000 already matched → 0 remaining
      expect(result.employerMatchAmount).toBe(0);
    });

    describe('multi-account employer match independence', () => {
      it('should track employer match independently across multiple accounts', () => {
        const tracker = new ContributionTracker();
        const rule401k = new ContributionRule(
          createContributionRule({
            id: 'rule-401k',
            contributionType: 'dollarAmount',
            dollarAmount: 10000,
            accountId: '401k-1',
            rank: 1,
            employerMatch: 7000,
          }),
          tracker
        );
        const ruleHsa = new ContributionRule(
          createContributionRule({
            id: 'rule-hsa',
            contributionType: 'dollarAmount',
            dollarAmount: 3000,
            accountId: 'hsa-1',
            rank: 2,
            employerMatch: 750,
          }),
          tracker
        );

        const account401k = new TaxDeferredAccount(create401kAccount());
        const accountHsa = new TaxDeferredAccount({
          type: 'hsa',
          id: 'hsa-1',
          name: 'HSA',
          balance: 5000,
          percentBonds: 10,
        });

        // Process 401(k) rule first
        const result401k = rule401k.calculateContribution(50000, account401k, 35);
        expect(result401k.contributionAmount).toBe(10000);
        expect(result401k.employerMatchAmount).toBe(7000);

        // Record the 401(k) contribution
        rule401k.recordContribution(10000, 7000, '401k');

        // Process HSA rule — should be independent of 401(k) match
        const resultHsa = ruleHsa.calculateContribution(40000, accountHsa, 35);
        expect(resultHsa.contributionAmount).toBe(3000);
        expect(resultHsa.employerMatchAmount).toBe(750);
      });

      it("should not let one account's employer match affect another account's match", () => {
        const tracker = new ContributionTracker();
        const rule401k = new ContributionRule(
          createContributionRule({
            id: 'rule-401k',
            contributionType: 'dollarAmount',
            dollarAmount: 6000,
            accountId: '401k-1',
            rank: 1,
            employerMatch: 7000,
          }),
          tracker
        );
        const ruleHsa = new ContributionRule(
          createContributionRule({
            id: 'rule-hsa',
            contributionType: 'dollarAmount',
            dollarAmount: 2000,
            accountId: 'hsa-1',
            rank: 2,
            employerMatch: 750,
          }),
          tracker
        );

        const account401k = new TaxDeferredAccount(create401kAccount());
        const accountHsa = new TaxDeferredAccount({
          type: 'hsa',
          id: 'hsa-1',
          name: 'HSA',
          balance: 5000,
          percentBonds: 10,
        });

        // Prior month: 401(k) has 3k employee + 5k employer; HSA has 0
        rule401k.recordContribution(3000, 5000, '401k');

        // 401(k): dollarAmount=6000, 3k employee so far → 3k remaining
        // employerMatch=7000, 5k already matched → 2k remaining; min(3000, 2000) = $2,000
        const result401k = rule401k.calculateContribution(50000, account401k, 35);
        expect(result401k.contributionAmount).toBe(3000);
        expect(result401k.employerMatchAmount).toBe(2000);

        // HSA: dollarAmount=2000, 0 employee so far → full $2,000
        // employerMatch=750, $0 already matched → full $750; min(2000, 750) = $750
        const resultHsa = ruleHsa.calculateContribution(50000, accountHsa, 35);
        expect(resultHsa.contributionAmount).toBe(2000);
        expect(resultHsa.employerMatchAmount).toBe(750);
      });
    });
  });

  // ============================================================================
  // Rule Ordering Tests
  // ============================================================================

  describe('rule ordering', () => {
    it('should return rules in rank order', () => {
      const rules = new ContributionRules(
        [
          createContributionRule({ rank: 3, id: 'rule-3' }),
          createContributionRule({ rank: 1, id: 'rule-1' }),
          createContributionRule({ rank: 2, id: 'rule-2' }),
        ],
        { type: 'spend' }
      );

      const orderedRules = rules.getRules().sort((a, b) => a.getRank() - b.getRank());

      expect(orderedRules[0].getRank()).toBe(1);
      expect(orderedRules[1].getRank()).toBe(2);
      expect(orderedRules[2].getRank()).toBe(3);
    });

    it('should filter out disabled rules', () => {
      const rules = new ContributionRules(
        [
          createContributionRule({ rank: 1, id: 'rule-1', disabled: false }),
          createContributionRule({ rank: 2, id: 'rule-2', disabled: true }),
          createContributionRule({ rank: 3, id: 'rule-3', disabled: false }),
        ],
        { type: 'spend' }
      );

      expect(rules.getRules().length).toBe(2);
    });
  });

  // ============================================================================
  // Max Balance Tests
  // ============================================================================

  describe('max balance limits', () => {
    it('should stop contributions when account reaches max balance', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'savings-1',
          maxBalance: 15000,
        }),
        tracker
      );
      const account = new SavingsAccount(createSavingsAccountInput({ balance: 12000 }));

      const result = rule.calculateContribution(10000, account, 35);

      // Can only contribute 3000 more to reach 15000 max
      expect(result.contributionAmount).toBe(3000);
    });

    it('should not contribute when already at max balance', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'savings-1',
          maxBalance: 10000,
        }),
        tracker
      );
      const account = new SavingsAccount(createSavingsAccountInput({ balance: 10000 }));

      const result = rule.calculateContribution(5000, account, 35);

      expect(result.contributionAmount).toBe(0);
    });

    it('should cap dollarAmount contribution at maxBalance remaining room', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 5000,
          accountId: 'savings-1',
          maxBalance: 15000,
        }),
        tracker
      );
      const account = new SavingsAccount(createSavingsAccountInput({ balance: 12000 }));

      const result = rule.calculateContribution(10000, account, 35);

      // maxBalance room = 15000 - 12000 = 3000, which beats dollarAmount of 5000
      expect(result.contributionAmount).toBe(3000);
    });

    it('should cap percentRemaining contribution at maxBalance remaining room', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'percentRemaining',
          percentRemaining: 50,
          accountId: 'savings-1',
          maxBalance: 10000,
        }),
        tracker
      );
      const account = new SavingsAccount(createSavingsAccountInput({ balance: 9000 }));

      const result = rule.calculateContribution(8000, account, 35);

      // maxBalance room = 10000 - 9000 = 1000, which beats 50% of 8000 = 4000
      expect(result.contributionAmount).toBe(1000);
    });

    it('should not apply max balance limit if not set', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'savings-1',
          // No maxBalance set
        }),
        tracker
      );
      const account = new SavingsAccount(createSavingsAccountInput({ balance: 1000000 }));

      const result = rule.calculateContribution(50000, account, 35);

      expect(result.contributionAmount).toBe(50000);
    });
  });

  // ============================================================================
  // Income Allocation Tests
  // ============================================================================

  describe('income allocation filtering', () => {
    it('should only contribute from specified income IDs', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: '401k-1',
          incomeIds: ['income-1', 'income-2'],
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const incomesData = createEmptyIncomesData({
        perIncomeData: {
          'income-1': {
            id: 'income-1',
            name: 'Salary',
            income: 5000,
            amountWithheld: 0,
            ficaTax: 0,
            incomeAfterPayrollDeductions: 5000,
            taxFreeIncome: 0,
            socialSecurityIncome: 0,
          },
          'income-2': {
            id: 'income-2',
            name: 'Bonus',
            income: 2000,
            amountWithheld: 0,
            ficaTax: 0,
            incomeAfterPayrollDeductions: 2000,
            taxFreeIncome: 0,
            socialSecurityIncome: 0,
          },
          'income-3': {
            id: 'income-3',
            name: 'Side Gig',
            income: 3000,
            amountWithheld: 0,
            ficaTax: 0,
            incomeAfterPayrollDeductions: 3000,
            taxFreeIncome: 0,
            socialSecurityIncome: 0,
          },
        },
      });

      // Total remaining is 10000, but eligible income is only 7000 (income-1 + income-2)
      const result = rule.calculateContribution(10000, account, 35, incomesData);

      expect(result.contributionAmount).toBe(7000);
    });

    it('should use contribution limit when it is more restrictive than eligible income', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: '401k-1',
          incomeIds: ['income-1'],
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const incomesData = createEmptyIncomesData({
        perIncomeData: {
          'income-1': {
            id: 'income-1',
            name: 'Salary',
            income: 3000,
            amountWithheld: 0,
            ficaTax: 0,
            incomeAfterPayrollDeductions: 3000,
            taxFreeIncome: 0,
            socialSecurityIncome: 0,
          },
        },
      });

      // Prior 401k contributions: 22000 employee
      rule.recordContribution(22000, 0, '401k');

      // Contribution limit remaining = 24500 - 22000 = 2500 (binding); income = 3000
      const result = rule.calculateContribution(10000, account, 35, incomesData);

      expect(result.contributionAmount).toBe(2500);
    });

    it('should use income cap when eligible income is below contribution limit remaining', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: '401k-1',
          incomeIds: ['income-1'],
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const incomesData = createEmptyIncomesData({
        perIncomeData: {
          'income-1': {
            id: 'income-1',
            name: 'Salary',
            income: 1500,
            amountWithheld: 0,
            ficaTax: 0,
            incomeAfterPayrollDeductions: 1500,
            taxFreeIncome: 0,
            socialSecurityIncome: 0,
          },
        },
      });

      // Prior 401k contributions: 22000 employee
      rule.recordContribution(22000, 0, '401k');

      // Contribution limit remaining = 24500 - 22000 = 2500; income = 1500 (binding)
      const result = rule.calculateContribution(10000, account, 35, incomesData);

      expect(result.contributionAmount).toBe(1500);
    });

    it('should cap dollarAmount at eligible income', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 5000,
          accountId: '401k-1',
          incomeIds: ['income-1'],
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const incomesData = createEmptyIncomesData({
        perIncomeData: {
          'income-1': {
            id: 'income-1',
            name: 'Salary',
            income: 2000,
            amountWithheld: 0,
            ficaTax: 0,
            incomeAfterPayrollDeductions: 2000,
            taxFreeIncome: 0,
            socialSecurityIncome: 0,
          },
        },
      });

      // No prior history, dollarAmount=5000 but eligible income=2000 (binding)
      const result = rule.calculateContribution(10000, account, 35, incomesData);

      expect(result.contributionAmount).toBe(2000);
    });

    it('should use all income when no income IDs specified', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: '401k-1',
          // No incomeIds specified
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const result = rule.calculateContribution(10000, account, 35);

      expect(result.contributionAmount).toBe(10000);
    });
  });

  // ============================================================================
  // Base Rule Tests
  // ============================================================================

  describe('base contribution rule', () => {
    it('should return spend as base rule type', () => {
      const rules = new ContributionRules([], { type: 'spend' });
      expect(rules.getBaseRuleType()).toBe('spend');
    });

    it('should return save as base rule type', () => {
      const rules = new ContributionRules([], { type: 'save' });
      expect(rules.getBaseRuleType()).toBe('save');
    });
  });

  // ============================================================================
  // Shared Limit Tests
  // ============================================================================

  describe('shared contribution limits across account types', () => {
    it('should count 401k contributions against roth401k limit', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'roth401k-1',
        }),
        tracker
      );

      // Roth 401k account
      const roth401kAccountData: AccountInputs & { type: 'roth401k' } = {
        type: 'roth401k',
        id: 'roth401k-1',
        name: 'Roth 401k',
        balance: 50000,
        percentBonds: 20,
        contributionBasis: 50000,
      };
      const account = new TaxFreeAccount(roth401kAccountData);

      // Already contributed 20k to traditional 401k (via a different rule)
      tracker.recordContribution('401k', 20000, 0);

      // At age 35, limit is 24,500 for 401k+roth401k combined
      // Already contributed 20k to 401k, so roth401k can only get 4,500
      const result = rule.calculateContribution(10000, account, 35);

      expect(result.contributionAmount).toBe(4500);
    });

    it('should count traditional IRA contributions against Roth IRA limit', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'roth-ira-1',
        }),
        tracker
      );
      const account = new TaxFreeAccount(createRothIraAccount({ id: 'roth-ira-1' }));

      // Already contributed 5k to traditional IRA (via a different rule)
      tracker.recordContribution('ira', 5000, 0);

      // At age 35, IRA limit is 7,500 for IRA+rothIRA combined
      // Already contributed 5k to IRA, so Roth IRA can only get 2,500
      const result = rule.calculateContribution(10000, account, 35);

      expect(result.contributionAmount).toBe(2500);
    });
  });

  // ============================================================================
  // Section 415(c) Limit Tests
  // ============================================================================

  // Note: IRS §414(v)(3)(A) exempts catch-up contributions from the §415(c) limit.
  // The engine lumps catch-up into getAnnualSection415cLimit (e.g. $80k = $72k + $8k),
  // but since catch-up also appears in the contribution tally, the math is equivalent.
  describe('Section 415(c) limits', () => {
    it('should return $72,000 for age under 50', () => {
      expect(getAnnualSection415cLimit(35)).toBe(72000);
      expect(getAnnualSection415cLimit(49)).toBe(72000);
    });

    it('should return $80,000 for age 50+', () => {
      expect(getAnnualSection415cLimit(50)).toBe(80000);
      expect(getAnnualSection415cLimit(59)).toBe(80000);
    });

    it('should return $83,250 super catch-up for ages 60-63', () => {
      expect(getAnnualSection415cLimit(60)).toBe(83250);
      expect(getAnnualSection415cLimit(63)).toBe(83250);
    });

    it('should fall back to $80,000 at age 64', () => {
      expect(getAnnualSection415cLimit(64)).toBe(80000);
    });
  });

  // ============================================================================
  // supportsMegaBackdoorRoth Tests
  // ============================================================================

  describe('supportsMegaBackdoorRoth', () => {
    it('should return true for Roth employer plan accounts', () => {
      expect(supportsMegaBackdoorRoth('roth401k')).toBe(true);
      expect(supportsMegaBackdoorRoth('roth403b')).toBe(true);
    });

    it('should return false for all other account types', () => {
      expect(supportsMegaBackdoorRoth('401k')).toBe(false);
      expect(supportsMegaBackdoorRoth('403b')).toBe(false);
      expect(supportsMegaBackdoorRoth('rothIra')).toBe(false);
      expect(supportsMegaBackdoorRoth('ira')).toBe(false);
      expect(supportsMegaBackdoorRoth('hsa')).toBe(false);
      expect(supportsMegaBackdoorRoth('savings')).toBe(false);
      expect(supportsMegaBackdoorRoth('taxableBrokerage')).toBe(false);
    });
  });

  // ============================================================================
  // Mega-Backdoor Roth Tests
  // ============================================================================

  describe('mega-backdoor Roth', () => {
    describe('basic 415(c) limit enforcement', () => {
      it('should cap MBR roth401k at $72,000 with no prior contributions at age 35', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(72000);
      });

      it('should allow remaining $12,000 when $60,000 already contributed', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // $60k already contributed
        rule.recordContribution(60000, 0, 'roth401k');

        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(12000);
      });

      it('should contribute $0 when already at $72,000', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // $72k already contributed
        rule.recordContribution(72000, 0, 'roth401k');

        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(0);
      });
    });

    describe('MBR on roth403b', () => {
      it('should cap MBR roth403b at $72,000 with no prior contributions', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth403b-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth403bAccount());

        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(72000);
      });
    });

    // IRS deviation: §415(c) applies per employer, so two employers each get their own
    // $72,000 limit (though §402(g) elective deferrals are shared). The engine treats all
    // 401k/403b accounts as a single §415(c) bucket — correct for single-employer, but
    // overly restrictive for multi-employer scenarios.
    describe('cross-account shared 415(c) limits', () => {
      it('should count 401k employee contributions against MBR roth401k 415(c) limit', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // $24,500 employee already contributed to 401k (via a different rule)
        tracker.recordContribution('401k', 24500, 0);

        // 415(c) limit at age 35 = $72,000. Already $24,500 total → $47,500 remaining
        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(47500);
      });

      it('should count 401k employee + employer contributions against MBR roth401k 415(c) limit', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // $24,500 employee + $7,000 employer = $31,500 total in 401k (via a different rule)
        tracker.recordContribution('401k', 24500, 7000);

        // 415(c) limit = $72,000. Total (incl employer) = $31,500 → $40,500 remaining
        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(40500);
      });

      it('should share 415(c) limit between 401k and MBR roth403b (cross-plan-type)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth403b-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth403bAccount());

        // $20,000 already contributed to 401k (via a different rule)
        tracker.recordContribution('401k', 20000, 0);

        // 415(c) = $72,000. $20,000 from 401k → $52,000 remaining for roth403b MBR
        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(52000);
      });

      it('should not affect IRA limits when MBR is used on roth401k', () => {
        const tracker = new ContributionTracker();
        const iraRule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth-ira-1',
          }),
          tracker
        );
        const iraAccount = new TaxFreeAccount(createRothIraAccount());

        // MBR roth401k has $60k contributed — should not affect IRA
        tracker.recordContribution('roth401k', 60000, 0);

        // IRA limit at age 35 = $7,500, completely independent of 401k/roth401k
        const result = iraRule.calculateContribution(10000, iraAccount, 35);

        expect(result.contributionAmount).toBe(7500);
      });
    });

    describe('MBR + employer match edge cases', () => {
      it('should not cap employer match against 415(c) remaining (known simplification)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
            employerMatch: 5000,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // Prior total = $71,000 in shared limit group (via a different rule)
        tracker.recordContribution('401k', 71000, 0);

        // 415(c) remaining = $72,000 - $71,000 = $1,000
        // Employee contribution capped at $1,000
        // Employer match = min($1,000 employee, $5,000 configured) = $1,000
        // Note: the engine does NOT cap employer match against 415(c) remaining space.
        // Total this period = $2,000, pushing annual to $73,000 (exceeds $72,000).
        // This documents current behavior — a known simplification.
        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(1000);
        expect(result.employerMatchAmount).toBe(1000);
      });
    });

    describe('MBR edge cases', () => {
      it('should use elective deferral limit when MBR is disabled', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: false,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        const result = rule.calculateContribution(100000, account, 35);

        // Uses $24,500 elective deferral limit, NOT $72,000
        expect(result.contributionAmount).toBe(24500);
      });

      it('should cap dollar amount at 415(c) remaining with prior contributions', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 50000,
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // $30,000 already contributed
        rule.recordContribution(30000, 0, 'roth401k');

        // 415(c) remaining = $72,000 - $30,000 = $42,000
        // Dollar amount desired = $50,000 - $30,000 already = $20,000
        // Min($20,000, $42,000) = $20,000
        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(20000);
      });

      it('should cap percentRemaining at 415(c) limit', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'percentRemaining',
            percentRemaining: 100,
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // 100% of $100,000 = $100,000, but capped at $72,000
        const result = rule.calculateContribution(100000, account, 35);

        expect(result.contributionAmount).toBe(72000);
      });

      it('should respect maxBalance over 415(c) remaining when maxBalance is lower', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
            maxBalance: 50000,
          }),
          tracker
        );
        // Balance is 40,000, maxBalance is 50,000 → only $10,000 room
        const account = new TaxFreeAccount(createRoth401kAccount({ balance: 40000 }));

        const result = rule.calculateContribution(100000, account, 35);

        // maxBalance cap ($10,000) wins since it's lower than 415(c) ($72,000)
        expect(result.contributionAmount).toBe(10000);
      });

      it('should respect income allocation over 415(c) remaining when eligible income is lower', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
            incomeIds: ['income-1'],
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        const incomesData = createEmptyIncomesData({
          perIncomeData: {
            'income-1': {
              id: 'income-1',
              name: 'Salary',
              income: 30000,
              amountWithheld: 0,
              ficaTax: 0,
              incomeAfterPayrollDeductions: 30000,
              taxFreeIncome: 0,
              socialSecurityIncome: 0,
            },
          },
        });

        // Eligible income = $30,000, 415(c) = $72,000
        // Income allocation ($30,000) wins since it's lower
        const result = rule.calculateContribution(100000, account, 35, incomesData);

        expect(result.contributionAmount).toBe(30000);
      });

      it('should ignore MBR flag on unsupported account types (traditional 401k)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: '401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.calculateContribution(100000, account, 35);

        // Traditional 401k doesn't support MBR — must use $24,500 elective deferral, NOT $72,000
        expect(result.contributionAmount).toBe(24500);
      });

      it('should ignore MBR flag on IRA accounts', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth-ira-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRothIraAccount());

        const result = rule.calculateContribution(100000, account, 35);

        // Roth IRA doesn't support MBR — must use $7,500 IRA limit, NOT $72,000
        expect(result.contributionAmount).toBe(7500);
      });

      it('should use $80,000 at age 59 (not $83,250 super catch-up)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        const result = rule.calculateContribution(100000, account, 59);

        // Age 59 gets standard catch-up ($80,000), NOT super catch-up ($83,250 is ages 60-63)
        expect(result.contributionAmount).toBe(80000);
      });
    });

    describe('dual Roth 401(k) with mixed MBR settings', () => {
      it('should give each rule the correct limit independently (MBR → $72k, non-MBR → $24.5k)', () => {
        const tracker = new ContributionTracker();
        const mbrRule = new ContributionRule(
          createContributionRule({
            id: 'rule-mbr',
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const nonMbrRule = new ContributionRule(
          createContributionRule({
            id: 'rule-no-mbr',
            contributionType: 'unlimited',
            accountId: 'roth401k-2',
            enableMegaBackdoorRoth: false,
          }),
          tracker
        );
        const mbrAccount = new TaxFreeAccount(createRoth401kAccount({ id: 'roth401k-1' }));
        const nonMbrAccount = new TaxFreeAccount(createRoth401kAccount({ id: 'roth401k-2' }));

        const mbrResult = mbrRule.calculateContribution(100000, mbrAccount, 35);
        const nonMbrResult = nonMbrRule.calculateContribution(100000, nonMbrAccount, 35);

        expect(mbrResult.contributionAmount).toBe(72000);
        expect(nonMbrResult.contributionAmount).toBe(24500);
      });

      it('should block non-MBR rule when MBR rule consumed the full §402(g) budget', () => {
        const tracker = new ContributionTracker();
        const nonMbrRule = new ContributionRule(
          createContributionRule({
            id: 'rule-no-mbr',
            contributionType: 'unlimited',
            accountId: 'roth401k-2',
            enableMegaBackdoorRoth: false,
          }),
          tracker
        );
        const nonMbrAccount = new TaxFreeAccount(createRoth401kAccount({ id: 'roth401k-2' }));

        // MBR account already contributed $72k — shared limit tracking sums by account type
        tracker.recordContribution('roth401k', 72000, 0);

        // Non-MBR rule uses §402(g) = $24,500
        // Shared contributions across roth401k type = $72,000
        // Remaining = max(0, $24,500 - $72,000) = $0
        // This is correct: the first $24.5k of MBR contributions ARE elective deferrals,
        // so they consume the §402(g) budget shared across all accounts of this type.
        const result = nonMbrRule.calculateContribution(100000, nonMbrAccount, 35);

        expect(result.contributionAmount).toBe(0);
      });

      it('should allow both rules to contribute when MBR stays within §402(g)', () => {
        const tracker = new ContributionTracker();
        const mbrRule = new ContributionRule(
          createContributionRule({
            id: 'rule-mbr',
            contributionType: 'dollarAmount',
            dollarAmount: 20000,
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const nonMbrRule = new ContributionRule(
          createContributionRule({
            id: 'rule-no-mbr',
            contributionType: 'unlimited',
            accountId: 'roth401k-2',
            enableMegaBackdoorRoth: false,
          }),
          tracker
        );
        const mbrAccount = new TaxFreeAccount(createRoth401kAccount({ id: 'roth401k-1' }));
        const nonMbrAccount = new TaxFreeAccount(createRoth401kAccount({ id: 'roth401k-2' }));

        // MBR rule contributes first — $20k with no prior contributions
        const mbrResult = mbrRule.calculateContribution(100000, mbrAccount, 35);
        expect(mbrResult.contributionAmount).toBe(20000);

        // Record the MBR contribution
        mbrRule.recordContribution(20000, 0, 'roth401k');

        // Non-MBR rule uses §402(g) = $24,500
        // Shared contributions across roth401k type = $20,000
        // Remaining = $24,500 - $20,000 = $4,500
        // Demonstrates users can split elective deferrals across accounts using explicit dollar amounts.
        const nonMbrResult = nonMbrRule.calculateContribution(100000, nonMbrAccount, 35);

        expect(nonMbrResult.contributionAmount).toBe(4500);
      });
    });
  });

  // ============================================================================
  // Multiple Constraints Active Simultaneously
  // ============================================================================

  describe('multiple constraints active simultaneously', () => {
    it('should apply the most restrictive constraint when dollarAmount, maxBalance, employer match, and contribution limit are all active', () => {
      const tracker = new ContributionTracker();
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 5000,
          accountId: '401k-1',
          maxBalance: 100000,
          employerMatch: 5000,
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount({ balance: 98500 }));

      // Two 401k accounts contributing to shared limit:
      // This rule: 2000 employee contributions
      rule.recordContribution(2000, 0, '401k');
      // Another rule's contributions (via tracker directly): 22000 employee
      tracker.recordContribution('401k', 22000, 0);
      // Combined by account types = 24000

      // Constraints at age 35:
      // - dollarAmount remaining by rule: 5000 - 2000 = 3000
      // - maxBalance room: 100000 - 98500 = 1500
      // - contribution limit remaining: 24500 - 24000 = 500 (most restrictive, binding)
      // - cash: 10000
      const result = rule.calculateContribution(10000, account, 35);

      expect(result.contributionAmount).toBe(500);
      expect(result.employerMatchAmount).toBe(500); // min(500 contribution, 5000 match cap)
    });
  });

  // ============================================================================
  // Regression: Cross-Rule Shared Limit Visibility (Bug 1)
  // ============================================================================
  // Under the old monthlyPortfolioData approach, rules processed in the same month
  // could not see each other's contributions because monthlyData only contained
  // snapshots from *prior* months. These tests verify the shared tracker fixes this.

  describe('regression: shared limit group visibility across rules (Bug 1)', () => {
    it('should enforce combined 401k+roth401k limit when rules are processed sequentially', () => {
      const tracker = new ContributionTracker();
      const rule401k = new ContributionRule(
        createContributionRule({ id: 'rule-401k', contributionType: 'dollarAmount', dollarAmount: 20000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const ruleRoth401k = new ContributionRule(
        createContributionRule({ id: 'rule-roth401k', contributionType: 'unlimited', accountId: 'roth401k-1', rank: 2 }),
        tracker
      );

      const account401k = new TaxDeferredAccount(create401kAccount());
      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());

      const result1 = rule401k.calculateContribution(50000, account401k, 35);
      expect(result1.contributionAmount).toBe(20000);
      rule401k.recordContribution(20000, 0, '401k');

      // Shared limit is $24,500, already used $20k → $4,500 remaining
      const result2 = ruleRoth401k.calculateContribution(30000, accountRoth401k, 35);
      expect(result2.contributionAmount).toBe(4500);
    });

    it('should enforce combined IRA+rothIra limit when rules are processed sequentially', () => {
      const tracker = new ContributionTracker();
      const ruleIra = new ContributionRule(
        createContributionRule({ id: 'rule-ira', contributionType: 'dollarAmount', dollarAmount: 5000, accountId: 'ira-1', rank: 1 }),
        tracker
      );
      const ruleRothIra = new ContributionRule(
        createContributionRule({ id: 'rule-roth-ira', contributionType: 'unlimited', accountId: 'roth-ira-1', rank: 2 }),
        tracker
      );

      const accountIra = new TaxDeferredAccount({ type: 'ira', id: 'ira-1', name: 'IRA', balance: 50000, percentBonds: 20 });
      const accountRothIra = new TaxFreeAccount(createRothIraAccount());

      const result1 = ruleIra.calculateContribution(50000, accountIra, 35);
      expect(result1.contributionAmount).toBe(5000);
      ruleIra.recordContribution(5000, 0, 'ira');

      // Shared limit is $7,500, already used $5k → $2,500 remaining
      const result2 = ruleRothIra.calculateContribution(30000, accountRothIra, 35);
      expect(result2.contributionAmount).toBe(2500);
    });

    it('should enforce $24,500 across 3 rules: 401k + roth401k + 403b', () => {
      const tracker = new ContributionTracker();
      const rule401k = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 10000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const ruleRoth401k = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'dollarAmount', dollarAmount: 10000, accountId: 'roth401k-1', rank: 2 }),
        tracker
      );
      const rule403b = new ContributionRule(
        createContributionRule({ id: 'r3', contributionType: 'unlimited', accountId: '403b-1', rank: 3 }),
        tracker
      );

      const account401k = new TaxDeferredAccount(create401kAccount());
      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());
      const account403b = new TaxDeferredAccount({ type: '403b', id: '403b-1', name: '403b', balance: 50000, percentBonds: 20 });

      // Rule 1: $10k to 401k
      const r1 = rule401k.calculateContribution(50000, account401k, 35);
      expect(r1.contributionAmount).toBe(10000);
      rule401k.recordContribution(10000, 0, '401k');

      // Rule 2: $10k to roth401k — $14,500 remaining in shared limit, dollar amount is $10k
      const r2 = ruleRoth401k.calculateContribution(40000, accountRoth401k, 35);
      expect(r2.contributionAmount).toBe(10000);
      ruleRoth401k.recordContribution(10000, 0, 'roth401k');

      // Rule 3: unlimited to 403b — only $4,500 left in shared $24,500 limit
      const r3 = rule403b.calculateContribution(30000, account403b, 35);
      expect(r3.contributionAmount).toBe(4500);
    });

    it('should enforce 415(c) limit across 401k rule + MBR roth401k rule in same month', () => {
      const tracker = new ContributionTracker();
      const rule401k = new ContributionRule(
        createContributionRule({
          id: 'r-401k',
          contributionType: 'dollarAmount',
          dollarAmount: 24500,
          accountId: '401k-1',
          rank: 1,
          employerMatch: 7000,
        }),
        tracker
      );
      const ruleMbr = new ContributionRule(
        createContributionRule({
          id: 'r-mbr',
          contributionType: 'unlimited',
          accountId: 'roth401k-1',
          rank: 2,
          enableMegaBackdoorRoth: true,
        }),
        tracker
      );

      const account401k = new TaxDeferredAccount(create401kAccount());
      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());

      // Rule 1: $24,500 employee + $7,000 employer = $31,500 total to 401k
      const r1 = rule401k.calculateContribution(50000, account401k, 35);
      expect(r1.contributionAmount).toBe(24500);
      expect(r1.employerMatchAmount).toBe(7000);
      rule401k.recordContribution(24500, 7000, '401k');

      // Rule 2 (MBR): 415(c) = $72,000 − $31,500 = $40,500 remaining
      const r2 = ruleMbr.calculateContribution(100000, accountRoth401k, 35);
      expect(r2.contributionAmount).toBe(40500);
    });

    it('should not let HSA contributions affect 401k shared limit and vice versa', () => {
      const tracker = new ContributionTracker();
      const rule401k = new ContributionRule(
        createContributionRule({ id: 'r-401k', contributionType: 'unlimited', accountId: '401k-1', rank: 1 }),
        tracker
      );
      const ruleHsa = new ContributionRule(
        createContributionRule({ id: 'r-hsa', contributionType: 'unlimited', accountId: 'hsa-1', rank: 2 }),
        tracker
      );

      const account401k = new TaxDeferredAccount(create401kAccount());
      const accountHsa = new TaxDeferredAccount({ type: 'hsa', id: 'hsa-1', name: 'HSA', balance: 5000, percentBonds: 10 });

      // 401k: unlimited, capped at $24,500
      const r1 = rule401k.calculateContribution(50000, account401k, 35);
      expect(r1.contributionAmount).toBe(24500);
      rule401k.recordContribution(24500, 0, '401k');

      // HSA: should still get full $4,400 — different limit group entirely
      const r2 = ruleHsa.calculateContribution(25500, accountHsa, 35);
      expect(r2.contributionAmount).toBe(4400);
    });

    it('should enforce shared limit when MBR roth401k goes first, then non-MBR 401k follows', () => {
      const tracker = new ContributionTracker();
      const ruleMbr = new ContributionRule(
        createContributionRule({
          id: 'r-mbr',
          contributionType: 'dollarAmount',
          dollarAmount: 30000,
          accountId: 'roth401k-1',
          rank: 1,
          enableMegaBackdoorRoth: true,
        }),
        tracker
      );
      const rule401k = new ContributionRule(
        createContributionRule({ id: 'r-401k', contributionType: 'unlimited', accountId: '401k-1', rank: 2 }),
        tracker
      );

      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());
      const account401k = new TaxDeferredAccount(create401kAccount());

      // MBR rule: $30k (under 415(c) of $72k)
      const r1 = ruleMbr.calculateContribution(100000, accountRoth401k, 35);
      expect(r1.contributionAmount).toBe(30000);
      ruleMbr.recordContribution(30000, 0, 'roth401k');

      // 401k rule: §402(g) = $24,500, but tracker shows $30k across the group → $0
      const r2 = rule401k.calculateContribution(70000, account401k, 35);
      expect(r2.contributionAmount).toBe(0);
    });
  });

  // ============================================================================
  // Regression: Per-Rule Dollar Amount Tracking (Bug 2)
  // ============================================================================
  // Under the old approach, getEmployeeContributionsSoFarByAccountID summed ALL
  // contributions to an account across all rules. When two rules had different
  // dollar amount targets for the same account, each saw the combined total and
  // miscalculated its own remaining budget.

  describe('regression: per-rule dollar amount tracking (Bug 2)', () => {
    it('two dollarAmount rules on same account: total = sum of both amounts', () => {
      const tracker = new ContributionTracker();
      const rule1 = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 2000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const rule2 = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'dollarAmount', dollarAmount: 3000, accountId: '401k-1', rank: 2 }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const r1 = rule1.calculateContribution(50000, account, 35);
      expect(r1.contributionAmount).toBe(2000);
      rule1.recordContribution(2000, 0, '401k');

      const r2 = rule2.calculateContribution(48000, account, 35);
      expect(r2.contributionAmount).toBe(3000);
      rule2.recordContribution(3000, 0, '401k');

      // Total contributed = $5,000 = sum of both dollar amounts
      // Both rules exhausted in month 2
      expect(rule1.calculateContribution(50000, account, 35).contributionAmount).toBe(0);
      expect(rule2.calculateContribution(50000, account, 35).contributionAmount).toBe(0);
    });

    it('three dollarAmount rules on same account: total = sum of all three', () => {
      const tracker = new ContributionTracker();
      const rule1 = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 3000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const rule2 = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'dollarAmount', dollarAmount: 5000, accountId: '401k-1', rank: 2 }),
        tracker
      );
      const rule3 = new ContributionRule(
        createContributionRule({ id: 'r3', contributionType: 'dollarAmount', dollarAmount: 4000, accountId: '401k-1', rank: 3 }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const r1 = rule1.calculateContribution(50000, account, 35);
      expect(r1.contributionAmount).toBe(3000);
      rule1.recordContribution(3000, 0, '401k');

      const r2 = rule2.calculateContribution(47000, account, 35);
      expect(r2.contributionAmount).toBe(5000);
      rule2.recordContribution(5000, 0, '401k');

      const r3 = rule3.calculateContribution(42000, account, 35);
      expect(r3.contributionAmount).toBe(4000);
      rule3.recordContribution(4000, 0, '401k');

      // Total = $12,000 = $3k + $5k + $4k
    });

    it('dollarAmount + percentRemaining on same account: each calculates independently', () => {
      const tracker = new ContributionTracker();
      const ruleDollar = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 5000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const rulePercent = new ContributionRule(
        createContributionRule({
          id: 'r2',
          contributionType: 'percentRemaining',
          percentRemaining: 50,
          accountId: '401k-1',
          rank: 2,
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      // Rule 1: $5k dollar amount
      const r1 = ruleDollar.calculateContribution(20000, account, 35);
      expect(r1.contributionAmount).toBe(5000);
      ruleDollar.recordContribution(5000, 0, '401k');

      // Rule 2: 50% of remaining $15k = $7,500
      const r2 = rulePercent.calculateContribution(15000, account, 35);
      expect(r2.contributionAmount).toBe(7500);
    });

    it('dollarAmount + unlimited on same account: dollar gets exact amount, unlimited gets rest up to limit', () => {
      const tracker = new ContributionTracker();
      const ruleDollar = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 5000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const ruleUnlimited = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'unlimited', accountId: '401k-1', rank: 2 }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const r1 = ruleDollar.calculateContribution(30000, account, 35);
      expect(r1.contributionAmount).toBe(5000);
      ruleDollar.recordContribution(5000, 0, '401k');

      // Unlimited gets rest but capped at shared limit: $24,500 − $5,000 = $19,500
      const r2 = ruleUnlimited.calculateContribution(25000, account, 35);
      expect(r2.contributionAmount).toBe(19500);
    });

    it('partial dollar amount contributions across multiple months accumulate independently per rule', () => {
      const tracker = new ContributionTracker();
      const rule1 = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 5000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const rule2 = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'dollarAmount', dollarAmount: 8000, accountId: '401k-1', rank: 2 }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      // Month 1: partial contributions
      rule1.recordContribution(2000, 0, '401k');
      rule2.recordContribution(3000, 0, '401k');

      // Month 2: Rule 1 has $3k remaining (5000−2000), Rule 2 has $5k remaining (8000−3000)
      expect(rule1.calculateContribution(50000, account, 35).contributionAmount).toBe(3000);
      expect(rule2.calculateContribution(50000, account, 35).contributionAmount).toBe(5000);
    });

    it('two rules with independent employer matches on same account', () => {
      const tracker = new ContributionTracker();
      const rule1 = new ContributionRule(
        createContributionRule({
          id: 'r1',
          contributionType: 'dollarAmount',
          dollarAmount: 3000,
          accountId: '401k-1',
          rank: 1,
          employerMatch: 1500,
        }),
        tracker
      );
      const rule2 = new ContributionRule(
        createContributionRule({
          id: 'r2',
          contributionType: 'dollarAmount',
          dollarAmount: 4000,
          accountId: '401k-1',
          rank: 2,
          employerMatch: 2000,
        }),
        tracker
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const r1 = rule1.calculateContribution(50000, account, 35);
      expect(r1.contributionAmount).toBe(3000);
      expect(r1.employerMatchAmount).toBe(1500);
      rule1.recordContribution(3000, 1500, '401k');

      const r2 = rule2.calculateContribution(47000, account, 35);
      expect(r2.contributionAmount).toBe(4000);
      expect(r2.employerMatchAmount).toBe(2000);
      rule2.recordContribution(4000, 2000, '401k');

      // Both fully exhausted
      expect(rule1.calculateContribution(50000, account, 35).contributionAmount).toBe(0);
      expect(rule1.calculateContribution(50000, account, 35).employerMatchAmount).toBe(0);
      expect(rule2.calculateContribution(50000, account, 35).contributionAmount).toBe(0);
      expect(rule2.calculateContribution(50000, account, 35).employerMatchAmount).toBe(0);
    });
  });

  // ============================================================================
  // Cross-Rule + Shared Limit Stress Tests
  // ============================================================================
  // These combine both bugs: multiple rules that share an IRS limit group AND
  // use different contribution types, verifying the total never exceeds the limit.

  describe('cross-rule shared limit stress tests', () => {
    it('two dollarAmount rules on different accounts in same limit group: sum capped at $24,500', () => {
      const tracker = new ContributionTracker();
      const rule401k = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 15000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const ruleRoth401k = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'dollarAmount', dollarAmount: 15000, accountId: 'roth401k-1', rank: 2 }),
        tracker
      );

      const account401k = new TaxDeferredAccount(create401kAccount());
      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());

      // Rule 1: $15k
      const r1 = rule401k.calculateContribution(50000, account401k, 35);
      expect(r1.contributionAmount).toBe(15000);
      rule401k.recordContribution(15000, 0, '401k');

      // Rule 2: wants $15k but only $9,500 left in shared limit
      const r2 = ruleRoth401k.calculateContribution(35000, accountRoth401k, 35);
      expect(r2.contributionAmount).toBe(9500);
    });

    it('dollarAmount 401k + percentRemaining roth401k: percentage capped by shared limit', () => {
      const tracker = new ContributionTracker();
      const rule401k = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 20000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const ruleRoth401k = new ContributionRule(
        createContributionRule({
          id: 'r2',
          contributionType: 'percentRemaining',
          percentRemaining: 100,
          accountId: 'roth401k-1',
          rank: 2,
        }),
        tracker
      );

      const account401k = new TaxDeferredAccount(create401kAccount());
      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());

      const r1 = rule401k.calculateContribution(50000, account401k, 35);
      expect(r1.contributionAmount).toBe(20000);
      rule401k.recordContribution(20000, 0, '401k');

      // 100% of $30k = $30k, but shared limit only has $4,500 left
      const r2 = ruleRoth401k.calculateContribution(30000, accountRoth401k, 35);
      expect(r2.contributionAmount).toBe(4500);
    });

    it('unlimited 401k + unlimited roth401k: first rule hits limit, second gets $0', () => {
      const tracker = new ContributionTracker();
      const rule401k = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'unlimited', accountId: '401k-1', rank: 1 }),
        tracker
      );
      const ruleRoth401k = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'unlimited', accountId: 'roth401k-1', rank: 2 }),
        tracker
      );

      const account401k = new TaxDeferredAccount(create401kAccount());
      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());

      // First unlimited rule takes full $24,500
      const r1 = rule401k.calculateContribution(50000, account401k, 35);
      expect(r1.contributionAmount).toBe(24500);
      rule401k.recordContribution(24500, 0, '401k');

      // Second gets $0
      const r2 = ruleRoth401k.calculateContribution(25500, accountRoth401k, 35);
      expect(r2.contributionAmount).toBe(0);
    });

    it('employer match should not consume elective deferral limit but should appear in 415(c)', () => {
      const tracker = new ContributionTracker();
      const rule401k = new ContributionRule(
        createContributionRule({
          id: 'r1',
          contributionType: 'dollarAmount',
          dollarAmount: 20000,
          accountId: '401k-1',
          rank: 1,
          employerMatch: 10000,
        }),
        tracker
      );
      const ruleMbr = new ContributionRule(
        createContributionRule({
          id: 'r2',
          contributionType: 'unlimited',
          accountId: 'roth401k-1',
          rank: 2,
          enableMegaBackdoorRoth: true,
        }),
        tracker
      );

      const account401k = new TaxDeferredAccount(create401kAccount());
      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());

      // 401k: $20k employee + $10k employer = $30k total
      const r1 = rule401k.calculateContribution(50000, account401k, 35);
      expect(r1.contributionAmount).toBe(20000);
      expect(r1.employerMatchAmount).toBe(10000);
      rule401k.recordContribution(20000, 10000, '401k');

      // MBR roth401k: 415(c) = $72,000 − $30,000 (employee+employer) = $42,000
      const r2 = ruleMbr.calculateContribution(50000, accountRoth401k, 35);
      expect(r2.contributionAmount).toBe(42000);
    });

    it('two IRA rules with different dollar amounts should not exceed $7,500 combined', () => {
      const tracker = new ContributionTracker();
      const ruleIra = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 5000, accountId: 'ira-1', rank: 1 }),
        tracker
      );
      const ruleRothIra = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'dollarAmount', dollarAmount: 5000, accountId: 'roth-ira-1', rank: 2 }),
        tracker
      );

      const accountIra = new TaxDeferredAccount({ type: 'ira', id: 'ira-1', name: 'IRA', balance: 50000, percentBonds: 20 });
      const accountRothIra = new TaxFreeAccount(createRothIraAccount());

      const r1 = ruleIra.calculateContribution(50000, accountIra, 35);
      expect(r1.contributionAmount).toBe(5000);
      ruleIra.recordContribution(5000, 0, 'ira');

      // Wants $5k but only $2,500 left in shared IRA limit
      const r2 = ruleRothIra.calculateContribution(45000, accountRothIra, 35);
      expect(r2.contributionAmount).toBe(2500);
    });

    it('four rules across 401k/roth401k/403b/roth403b should not exceed $24,500 combined', () => {
      const tracker = new ContributionTracker();
      const r1 = new ContributionRule(
        createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 8000, accountId: '401k-1', rank: 1 }),
        tracker
      );
      const r2 = new ContributionRule(
        createContributionRule({ id: 'r2', contributionType: 'dollarAmount', dollarAmount: 8000, accountId: 'roth401k-1', rank: 2 }),
        tracker
      );
      const r3 = new ContributionRule(
        createContributionRule({ id: 'r3', contributionType: 'dollarAmount', dollarAmount: 8000, accountId: '403b-1', rank: 3 }),
        tracker
      );
      const r4 = new ContributionRule(
        createContributionRule({ id: 'r4', contributionType: 'dollarAmount', dollarAmount: 8000, accountId: 'roth403b-1', rank: 4 }),
        tracker
      );

      const a1 = new TaxDeferredAccount(create401kAccount());
      const a2 = new TaxFreeAccount(createRoth401kAccount());
      const a3 = new TaxDeferredAccount({ type: '403b', id: '403b-1', name: '403b', balance: 50000, percentBonds: 20 });
      const a4 = new TaxFreeAccount(createRoth403bAccount());

      const res1 = r1.calculateContribution(50000, a1, 35);
      expect(res1.contributionAmount).toBe(8000);
      r1.recordContribution(8000, 0, '401k');

      const res2 = r2.calculateContribution(42000, a2, 35);
      expect(res2.contributionAmount).toBe(8000);
      r2.recordContribution(8000, 0, 'roth401k');

      const res3 = r3.calculateContribution(34000, a3, 35);
      expect(res3.contributionAmount).toBe(8000);
      r3.recordContribution(8000, 0, '403b');

      // Only $500 left in shared limit ($24,500 − $24,000)
      const res4 = r4.calculateContribution(26000, a4, 35);
      expect(res4.contributionAmount).toBe(500);
    });
  });

  // ============================================================================
  // Configuration Combination Tests
  // ============================================================================
  // Each test exercises a different combination of constraints to verify they
  // compose correctly: maxBalance, incomeIds, employerMatch, MBR, contribution types.

  describe('configuration combinations', () => {
    describe('maxBalance + shared limit', () => {
      it('should cap at maxBalance when it is more restrictive than shared limit', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({ contributionType: 'unlimited', accountId: '401k-1', maxBalance: 101000 }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount({ balance: 100000 }));

        // maxBalance room = $1,000, shared limit room = $24,500
        const result = rule.calculateContribution(50000, account, 35);
        expect(result.contributionAmount).toBe(1000);
      });

      it('should cap at shared limit when maxBalance has more room', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({ contributionType: 'unlimited', accountId: '401k-1', maxBalance: 200000 }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount({ balance: 100000 }));

        // maxBalance room = $100,000, shared limit room = $24,500
        const result = rule.calculateContribution(50000, account, 35);
        expect(result.contributionAmount).toBe(24500);
      });
    });

    describe('income restrictions + shared limit', () => {
      const makeIncome = (id: string, amount: number) => ({
        id,
        name: id,
        income: amount,
        amountWithheld: 0,
        ficaTax: 0,
        incomeAfterPayrollDeductions: amount,
        taxFreeIncome: 0,
        socialSecurityIncome: 0,
      });

      it('different income restrictions on rules sharing a limit group', () => {
        const tracker = new ContributionTracker();
        const rule401k = new ContributionRule(
          createContributionRule({
            id: 'r1',
            contributionType: 'unlimited',
            accountId: '401k-1',
            rank: 1,
            incomeIds: ['salary'],
          }),
          tracker
        );
        const ruleRoth401k = new ContributionRule(
          createContributionRule({
            id: 'r2',
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            rank: 2,
            incomeIds: ['bonus'],
          }),
          tracker
        );

        const account401k = new TaxDeferredAccount(create401kAccount());
        const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());
        const incomesData = createEmptyIncomesData({
          perIncomeData: {
            salary: makeIncome('salary', 15000),
            bonus: makeIncome('bonus', 20000),
          },
        });

        // Rule 1: unlimited but income-capped at $15k. Also capped at $24,500 → $15k wins
        const r1 = rule401k.calculateContribution(50000, account401k, 35, incomesData);
        expect(r1.contributionAmount).toBe(15000);
        rule401k.recordContribution(15000, 0, '401k');

        // Rule 2: income is $20k, but shared limit only has $9,500 left
        const r2 = ruleRoth401k.calculateContribution(35000, accountRoth401k, 35, incomesData);
        expect(r2.contributionAmount).toBe(9500);
      });

      it('income restriction on MBR rule should cap below 415(c)', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
            incomeIds: ['salary'],
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth401kAccount());
        const incomesData = createEmptyIncomesData({
          perIncomeData: { salary: makeIncome('salary', 40000) },
        });

        // 415(c) = $72k, but income = $40k → income wins
        const result = rule.calculateContribution(100000, account, 35, incomesData);
        expect(result.contributionAmount).toBe(40000);
      });
    });

    describe('maxBalance + income + employer match combined', () => {
      it('should apply the most restrictive of all constraints', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 10000,
            accountId: '401k-1',
            maxBalance: 102000,
            employerMatch: 5000,
            incomeIds: ['salary'],
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount({ balance: 100000 }));
        const incomesData = createEmptyIncomesData({
          perIncomeData: {
            salary: {
              id: 'salary',
              name: 'Salary',
              income: 8000,
              amountWithheld: 0,
              ficaTax: 0,
              incomeAfterPayrollDeductions: 8000,
              taxFreeIncome: 0,
              socialSecurityIncome: 0,
            },
          },
        });

        // Constraints:
        // - dollarAmount: $10,000
        // - maxBalance room: $102,000 − $100,000 = $2,000 (binding)
        // - income: $8,000
        // - shared limit: $24,500
        // - cash: $50,000
        const result = rule.calculateContribution(50000, account, 35, incomesData);
        expect(result.contributionAmount).toBe(2000);
        expect(result.employerMatchAmount).toBe(2000); // min($2k contribution, $5k match)
      });
    });

    describe('MBR + maxBalance + employer match', () => {
      it('maxBalance should cap MBR contribution below 415(c) limit', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
            maxBalance: 55000,
            employerMatch: 3000,
          }),
          tracker
        );
        // Balance 50k, maxBalance 55k → only $5k room
        const account = new TaxFreeAccount(createRoth401kAccount({ balance: 50000 }));

        const result = rule.calculateContribution(100000, account, 35);
        expect(result.contributionAmount).toBe(5000);
        expect(result.employerMatchAmount).toBe(3000);
      });
    });

    describe('percentRemaining with employer match', () => {
      it('should calculate match correctly on percent-based contribution', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'percentRemaining',
            percentRemaining: 25,
            accountId: '401k-1',
            employerMatch: 10000,
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        // 25% of $20,000 = $5,000
        const result = rule.calculateContribution(20000, account, 35);
        expect(result.contributionAmount).toBe(5000);
        expect(result.employerMatchAmount).toBe(5000); // min($5k, $10k match cap) = $5k
      });

      it('should deplete employer match across months', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'percentRemaining',
            percentRemaining: 50,
            accountId: '401k-1',
            employerMatch: 3000,
          }),
          tracker
        );
        const account = new TaxDeferredAccount(create401kAccount());

        // Month 1: 50% of $8k = $4k, match = min($4k, $3k) = $3k
        const r1 = rule.calculateContribution(8000, account, 35);
        expect(r1.contributionAmount).toBe(4000);
        expect(r1.employerMatchAmount).toBe(3000);
        rule.recordContribution(4000, 3000, '401k');

        // Month 2: 50% of $8k = $4k, match remaining = $3k - $3k = $0
        const r2 = rule.calculateContribution(8000, account, 35);
        expect(r2.contributionAmount).toBe(4000);
        expect(r2.employerMatchAmount).toBe(0);
      });
    });

    describe('dollarAmount with MBR on roth403b', () => {
      it('should cap dollarAmount at 415(c) remaining', () => {
        const tracker = new ContributionTracker();
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 50000,
            accountId: 'roth403b-1',
            enableMegaBackdoorRoth: true,
          }),
          tracker
        );
        const account = new TaxFreeAccount(createRoth403bAccount());

        // Already $60k in the 401k/403b/roth group
        tracker.recordContribution('401k', 24500, 5500);
        tracker.recordContribution('roth401k', 30000, 0);
        // Total = employee $54,500 + employer $5,500 = $60,000

        // 415(c) at 35 = $72,000 − $60,000 = $12,000
        // Dollar amount desired = $50,000 − $0 already = $50,000
        // Min($50,000, $12,000) = $12,000
        const result = rule.calculateContribution(100000, account, 35);
        expect(result.contributionAmount).toBe(12000);
      });
    });
  });

  // ============================================================================
  // YTD Reset Tests
  // ============================================================================

  describe('resetYTD', () => {
    it('should reset per-rule YTD counters and shared tracker on year boundary', () => {
      const rules = new ContributionRules(
        [createContributionRule({ id: 'rule-1', contributionType: 'dollarAmount', dollarAmount: 2000, accountId: '401k-1', rank: 1 })],
        { type: 'spend' }
      );

      const rule = rules.getRules()[0];
      const account = new TaxDeferredAccount(create401kAccount());

      // Exhaust the dollar amount
      const result1 = rule.calculateContribution(50000, account, 35);
      expect(result1.contributionAmount).toBe(2000);
      rule.recordContribution(2000, 0, '401k');

      expect(rule.calculateContribution(50000, account, 35).contributionAmount).toBe(0);

      // Reset at year boundary
      rules.resetYTD();

      // Should be able to contribute again
      expect(rule.calculateContribution(50000, account, 35).contributionAmount).toBe(2000);
    });

    it('should reset shared limit tracking so second-year contributions start fresh', () => {
      const rules = new ContributionRules(
        [
          createContributionRule({ id: 'r1', contributionType: 'dollarAmount', dollarAmount: 20000, accountId: '401k-1', rank: 1 }),
          createContributionRule({ id: 'r2', contributionType: 'unlimited', accountId: 'roth401k-1', rank: 2 }),
        ],
        { type: 'spend' }
      );
      const [rule1, rule2] = rules.getRules().sort((a, b) => a.getRank() - b.getRank());
      const accountRoth401k = new TaxFreeAccount(createRoth401kAccount());

      // Year 1: rule1 takes $20k, rule2 gets $4,500
      rule1.recordContribution(20000, 0, '401k');
      const y1r2 = rule2.calculateContribution(50000, accountRoth401k, 35);
      expect(y1r2.contributionAmount).toBe(4500);

      // Reset for year 2
      rules.resetYTD();

      // Year 2: rule2 should get full $24,500 if processed first
      const y2r2 = rule2.calculateContribution(50000, accountRoth401k, 35);
      expect(y2r2.contributionAmount).toBe(24500);
    });

    it('should reset employer match counters for new year', () => {
      const rules = new ContributionRules(
        [
          createContributionRule({
            id: 'r1',
            contributionType: 'unlimited',
            accountId: '401k-1',
            rank: 1,
            employerMatch: 5000,
          }),
        ],
        { type: 'spend' }
      );
      const rule = rules.getRules()[0];
      const account = new TaxDeferredAccount(create401kAccount());

      // Year 1: fully exhaust employer match
      rule.recordContribution(10000, 5000, '401k');
      const y1 = rule.calculateContribution(10000, account, 35);
      expect(y1.employerMatchAmount).toBe(0); // exhausted

      // Reset
      rules.resetYTD();

      // Year 2: employer match available again
      const y2 = rule.calculateContribution(10000, account, 35);
      expect(y2.employerMatchAmount).toBe(5000);
    });
  });
});
