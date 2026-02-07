import { describe, it, expect } from 'vitest';

import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { ContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import {
  getAnnualContributionLimit,
  getAnnualSection415cLimit,
  sharedLimitAccounts,
  supportsMegaBackdoorRoth,
} from '@/lib/schemas/inputs/contribution-form-schema';

import { ContributionRules, ContributionRule } from './contribution-rules';
import { TaxDeferredAccount, TaxFreeAccount, SavingsAccount } from './account';
import type { PortfolioData } from './portfolio';
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

const createEmptyPortfolioData = (): PortfolioData => ({
  totalValue: 0,
  cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeEmployerMatch: 0,
  cumulativeRealizedGains: 0,
  cumulativeEarningsWithdrawn: 0,
  cumulativeRmds: 0,
  outstandingShortfall: 0,
  withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
  contributionsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
  employerMatchForPeriod: 0,
  realizedGainsForPeriod: 0,
  earningsWithdrawnForPeriod: 0,
  rmdsForPeriod: 0,
  shortfallForPeriod: 0,
  shortfallRepaidForPeriod: 0,
  perAccountData: {},
  assetAllocation: null,
});

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
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 1000,
            accountId: '401k-1',
          })
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.getContributionAmount(5000, account, [], 35);

        expect(result.contributionAmount).toBe(1000);
      });

      it('should not exceed remaining cash when dollar amount is higher', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 10000,
            accountId: '401k-1',
          })
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.getContributionAmount(5000, account, [], 35);

        expect(result.contributionAmount).toBe(5000);
      });

      it('should track contributions so far and only contribute remaining', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 2000,
            accountId: '401k-1',
          })
        );
        const account = new TaxDeferredAccount(create401kAccount());

        // First month: contribute 500
        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              '401k-1': {
                id: '401k-1',
                name: '401k',
                type: '401k',
                balance: 100000,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 400, bonds: 100, cash: 0 }, // 500 total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        // Second month: should only contribute remaining 1500
        const result = rule.getContributionAmount(5000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(1500);
      });
    });

    describe('percentRemaining type', () => {
      it('should contribute percentage of remaining cash', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'percentRemaining',
            percentRemaining: 50,
            accountId: '401k-1',
          })
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.getContributionAmount(4000, account, [], 35);

        expect(result.contributionAmount).toBe(2000); // 50% of 4000
      });

      it('should handle 100% of remaining', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'percentRemaining',
            percentRemaining: 100,
            accountId: '401k-1',
          })
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.getContributionAmount(5000, account, [], 35);

        expect(result.contributionAmount).toBe(5000);
      });
    });

    describe('unlimited type', () => {
      it('should contribute all remaining cash', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: '401k-1',
          })
        );
        const account = new TaxDeferredAccount(create401kAccount());

        const result = rule.getContributionAmount(7500, account, [], 35);

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
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: '401k-1',
          })
        );
        const account = new TaxDeferredAccount(create401kAccount());

        // Previous contributions of 20,000 in the year
        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              '401k-1': {
                id: '401k-1',
                name: '401k',
                type: '401k',
                balance: 120000,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 16000, bonds: 4000, cash: 0 }, // 20k total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        // At age 35, limit is 24,500. Already contributed 20k, so max is 4,500
        const result = rule.getContributionAmount(10000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(4500);
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
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 5000,
          accountId: '401k-1',
          employerMatch: 2500,
        })
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const result = rule.getContributionAmount(10000, account, [], 35);

      expect(result.contributionAmount).toBe(5000);
      expect(result.employerMatchAmount).toBe(2500);
    });

    it('should not exceed employee contribution for employer match', () => {
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 1000,
          accountId: '401k-1',
          employerMatch: 5000, // Higher than contribution
        })
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const result = rule.getContributionAmount(10000, account, [], 35);

      expect(result.contributionAmount).toBe(1000);
      expect(result.employerMatchAmount).toBe(1000); // Limited to employee contribution
    });

    it('should track employer match separately from employee contributions', () => {
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'dollarAmount',
          dollarAmount: 2000,
          accountId: '401k-1',
          employerMatch: 1500,
        })
      );
      const account = new TaxDeferredAccount(create401kAccount());

      // Previous: 1000 employee + 1000 employer match
      // Note: contributionsForPeriod includes both employee and employer
      // Employee portion = contributionsForPeriod - employerMatchForPeriod
      const monthlyData: PortfolioData[] = [
        {
          ...createEmptyPortfolioData(),
          perAccountData: {
            '401k-1': {
              id: '401k-1',
              name: '401k',
              type: '401k',
              balance: 100000,
              cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
              cumulativeEmployerMatch: 0,
              cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
              cumulativeRealizedGains: 0,
              cumulativeEarningsWithdrawn: 0,
              cumulativeRmds: 0,
              assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
              // Total 2000: 1000 employee + 1000 employer match
              contributionsForPeriod: { stocks: 1600, bonds: 400, cash: 0 },
              employerMatchForPeriod: 1000, // 1k employer already matched
              withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
              realizedGainsForPeriod: 0,
              earningsWithdrawnForPeriod: 0,
              rmdsForPeriod: 0,
            },
          },
        },
      ];

      const result = rule.getContributionAmount(5000, account, monthlyData, 35);

      // Employee contributes remaining 1000 (2000 - 1000 already contributed)
      expect(result.contributionAmount).toBe(1000);
      // Employer match remaining is 500 (1500 - 1000 already matched)
      expect(result.employerMatchAmount).toBe(500);
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
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'savings-1',
          maxBalance: 15000,
        })
      );
      const account = new SavingsAccount(createSavingsAccountInput({ balance: 12000 }));

      const result = rule.getContributionAmount(10000, account, [], 35);

      // Can only contribute 3000 more to reach 15000 max
      expect(result.contributionAmount).toBe(3000);
    });

    it('should not contribute when already at max balance', () => {
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'savings-1',
          maxBalance: 10000,
        })
      );
      const account = new SavingsAccount(createSavingsAccountInput({ balance: 10000 }));

      const result = rule.getContributionAmount(5000, account, [], 35);

      expect(result.contributionAmount).toBe(0);
    });

    it('should not apply max balance limit if not set', () => {
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'savings-1',
          // No maxBalance set
        })
      );
      const account = new SavingsAccount(createSavingsAccountInput({ balance: 1000000 }));

      const result = rule.getContributionAmount(50000, account, [], 35);

      expect(result.contributionAmount).toBe(50000);
    });
  });

  // ============================================================================
  // Income Allocation Tests
  // ============================================================================

  describe('income allocation filtering', () => {
    it('should only contribute from specified income IDs', () => {
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: '401k-1',
          incomeIds: ['income-1', 'income-2'],
        })
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
      const result = rule.getContributionAmount(10000, account, [], 35, incomesData);

      expect(result.contributionAmount).toBe(7000);
    });

    it('should use all income when no income IDs specified', () => {
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: '401k-1',
          // No incomeIds specified
        })
      );
      const account = new TaxDeferredAccount(create401kAccount());

      const result = rule.getContributionAmount(10000, account, [], 35);

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
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'roth401k-1',
        })
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

      // Already contributed 20k to traditional 401k
      const monthlyData: PortfolioData[] = [
        {
          ...createEmptyPortfolioData(),
          perAccountData: {
            '401k-1': {
              id: '401k-1',
              name: '401k',
              type: '401k',
              balance: 120000,
              cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
              cumulativeEmployerMatch: 0,
              cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
              cumulativeRealizedGains: 0,
              cumulativeEarningsWithdrawn: 0,
              cumulativeRmds: 0,
              assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
              contributionsForPeriod: { stocks: 16000, bonds: 4000, cash: 0 }, // 20k total
              employerMatchForPeriod: 0,
              withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
              realizedGainsForPeriod: 0,
              earningsWithdrawnForPeriod: 0,
              rmdsForPeriod: 0,
            },
          },
        },
      ];

      // At age 35, limit is 24,500 for 401k+roth401k combined
      // Already contributed 20k to 401k, so roth401k can only get 4,500
      const result = rule.getContributionAmount(10000, account, monthlyData, 35);

      expect(result.contributionAmount).toBe(4500);
    });

    it('should count traditional IRA contributions against Roth IRA limit', () => {
      const rule = new ContributionRule(
        createContributionRule({
          contributionType: 'unlimited',
          accountId: 'roth-ira-1',
        })
      );
      const account = new TaxFreeAccount(createRothIraAccount({ id: 'roth-ira-1' }));

      // Already contributed 5k to traditional IRA
      const monthlyData: PortfolioData[] = [
        {
          ...createEmptyPortfolioData(),
          perAccountData: {
            'ira-1': {
              id: 'ira-1',
              name: 'IRA',
              type: 'ira',
              balance: 55000,
              cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
              cumulativeEmployerMatch: 0,
              cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
              cumulativeRealizedGains: 0,
              cumulativeEarningsWithdrawn: 0,
              cumulativeRmds: 0,
              assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
              contributionsForPeriod: { stocks: 4000, bonds: 1000, cash: 0 }, // 5k total
              employerMatchForPeriod: 0,
              withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
              realizedGainsForPeriod: 0,
              earningsWithdrawnForPeriod: 0,
              rmdsForPeriod: 0,
            },
          },
        },
      ];

      // At age 35, IRA limit is 7,500 for IRA+rothIRA combined
      // Already contributed 5k to IRA, so Roth IRA can only get 2,500
      const result = rule.getContributionAmount(10000, account, monthlyData, 35);

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
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        const result = rule.getContributionAmount(100000, account, [], 35);

        expect(result.contributionAmount).toBe(72000);
      });

      it('should allow remaining $12,000 when $60,000 already contributed', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              'roth401k-1': {
                id: 'roth401k-1',
                name: 'Roth 401k',
                type: 'roth401k',
                balance: 110000,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 48000, bonds: 12000, cash: 0 }, // 60k total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        const result = rule.getContributionAmount(100000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(12000);
      });

      it('should contribute $0 when already at $72,000', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              'roth401k-1': {
                id: 'roth401k-1',
                name: 'Roth 401k',
                type: 'roth401k',
                balance: 122000,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 57600, bonds: 14400, cash: 0 }, // 72k total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        const result = rule.getContributionAmount(100000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(0);
      });
    });

    describe('MBR on roth403b', () => {
      it('should cap MBR roth403b at $72,000 with no prior contributions', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth403b-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth403bAccount());

        const result = rule.getContributionAmount(100000, account, [], 35);

        expect(result.contributionAmount).toBe(72000);
      });
    });

    // IRS deviation: §415(c) applies per employer, so two employers each get their own
    // $72,000 limit (though §402(g) elective deferrals are shared). The engine treats all
    // 401k/403b accounts as a single §415(c) bucket — correct for single-employer, but
    // overly restrictive for multi-employer scenarios.
    describe('cross-account shared 415(c) limits', () => {
      it('should count 401k employee contributions against MBR roth401k 415(c) limit', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // $24,500 employee already contributed to 401k
        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              '401k-1': {
                id: '401k-1',
                name: '401k',
                type: '401k',
                balance: 124500,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 19600, bonds: 4900, cash: 0 }, // 24,500 total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        // 415(c) limit at age 35 = $72,000. Already $24,500 total → $47,500 remaining
        const result = rule.getContributionAmount(100000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(47500);
      });

      it('should count 401k employee + employer contributions against MBR roth401k 415(c) limit', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // $24,500 employee + $7,000 employer = $31,500 total in 401k
        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              '401k-1': {
                id: '401k-1',
                name: '401k',
                type: '401k',
                balance: 131500,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 25200, bonds: 6300, cash: 0 }, // 31,500 total (incl employer)
                employerMatchForPeriod: 7000,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        // 415(c) limit = $72,000. Total (incl employer) = $31,500 → $40,500 remaining
        const result = rule.getContributionAmount(100000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(40500);
      });

      it('should share 415(c) limit between 401k and MBR roth403b (cross-plan-type)', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth403b-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth403bAccount());

        // $20,000 already contributed to 401k
        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              '401k-1': {
                id: '401k-1',
                name: '401k',
                type: '401k',
                balance: 120000,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 16000, bonds: 4000, cash: 0 }, // 20k total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        // 415(c) = $72,000. $20,000 from 401k → $52,000 remaining for roth403b MBR
        const result = rule.getContributionAmount(100000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(52000);
      });

      it('should not affect IRA limits when MBR is used on roth401k', () => {
        const iraRule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth-ira-1',
          })
        );
        const iraAccount = new TaxFreeAccount(createRothIraAccount());

        // MBR roth401k has $60k contributed — should not affect IRA
        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              'roth401k-1': {
                id: 'roth401k-1',
                name: 'Roth 401k',
                type: 'roth401k',
                balance: 110000,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 48000, bonds: 12000, cash: 0 }, // 60k total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        // IRA limit at age 35 = $7,500, completely independent of 401k/roth401k
        const result = iraRule.getContributionAmount(10000, iraAccount, monthlyData, 35);

        expect(result.contributionAmount).toBe(7500);
      });
    });

    describe('MBR + employer match edge cases', () => {
      it('should not cap employer match against 415(c) remaining (known simplification)', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
            employerMatch: 5000,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // Prior total = $71,000 in shared limit group
        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              '401k-1': {
                id: '401k-1',
                name: '401k',
                type: '401k',
                balance: 171000,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 56800, bonds: 14200, cash: 0 }, // 71k total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        // 415(c) remaining = $72,000 - $71,000 = $1,000
        // Employee contribution capped at $1,000
        // Employer match = min($1,000 employee, $5,000 configured) = $1,000
        // Note: the engine does NOT cap employer match against 415(c) remaining space.
        // Total this period = $2,000, pushing annual to $73,000 (exceeds $72,000).
        // This documents current behavior — a known simplification.
        const result = rule.getContributionAmount(100000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(1000);
        expect(result.employerMatchAmount).toBe(1000);
      });
    });

    describe('MBR edge cases', () => {
      it('should use elective deferral limit when MBR is disabled', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: false,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        const result = rule.getContributionAmount(100000, account, [], 35);

        // Uses $24,500 elective deferral limit, NOT $72,000
        expect(result.contributionAmount).toBe(24500);
      });

      it('should cap dollar amount at 415(c) remaining with prior contributions', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'dollarAmount',
            dollarAmount: 50000,
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // $30,000 already contributed
        const monthlyData: PortfolioData[] = [
          {
            ...createEmptyPortfolioData(),
            perAccountData: {
              'roth401k-1': {
                id: 'roth401k-1',
                name: 'Roth 401k',
                type: 'roth401k',
                balance: 80000,
                cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeEmployerMatch: 0,
                cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
                cumulativeRealizedGains: 0,
                cumulativeEarningsWithdrawn: 0,
                cumulativeRmds: 0,
                assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
                contributionsForPeriod: { stocks: 24000, bonds: 6000, cash: 0 }, // 30k total
                employerMatchForPeriod: 0,
                withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
                realizedGainsForPeriod: 0,
                earningsWithdrawnForPeriod: 0,
                rmdsForPeriod: 0,
              },
            },
          },
        ];

        // 415(c) remaining = $72,000 - $30,000 = $42,000
        // Dollar amount desired = $50,000 - $30,000 already = $20,000
        // Min($20,000, $42,000) = $20,000
        const result = rule.getContributionAmount(100000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(20000);
      });

      it('should cap percentRemaining at 415(c) limit', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'percentRemaining',
            percentRemaining: 100,
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
          })
        );
        const account = new TaxFreeAccount(createRoth401kAccount());

        // 100% of $100,000 = $100,000, but capped at $72,000
        const result = rule.getContributionAmount(100000, account, [], 35);

        expect(result.contributionAmount).toBe(72000);
      });

      it('should respect maxBalance over 415(c) remaining when maxBalance is lower', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
            maxBalance: 50000,
          })
        );
        // Balance is 40,000, maxBalance is 50,000 → only $10,000 room
        const account = new TaxFreeAccount(createRoth401kAccount({ balance: 40000 }));

        const result = rule.getContributionAmount(100000, account, [], 35);

        // maxBalance cap ($10,000) wins since it's lower than 415(c) ($72,000)
        expect(result.contributionAmount).toBe(10000);
      });

      it('should respect income allocation over 415(c) remaining when eligible income is lower', () => {
        const rule = new ContributionRule(
          createContributionRule({
            contributionType: 'unlimited',
            accountId: 'roth401k-1',
            enableMegaBackdoorRoth: true,
            incomeIds: ['income-1'],
          })
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
        const result = rule.getContributionAmount(100000, account, [], 35, incomesData);

        expect(result.contributionAmount).toBe(30000);
      });
    });
  });
});
