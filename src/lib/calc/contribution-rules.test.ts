import { describe, it, expect } from 'vitest';

import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { ContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import { getAnnualContributionLimit, sharedLimitAccounts } from '@/lib/schemas/inputs/contribution-form-schema';

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
  totalTaxExemptIncome: overrides?.totalTaxExemptIncome ?? 0,
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
      it('should enforce $23,500 limit for age under 50', () => {
        expect(getAnnualContributionLimit('401kCombined', 35)).toBe(23500);
        expect(getAnnualContributionLimit('401kCombined', 49)).toBe(23500);
      });

      it('should enforce $31,000 limit for age 50+', () => {
        expect(getAnnualContributionLimit('401kCombined', 50)).toBe(31000);
        expect(getAnnualContributionLimit('401kCombined', 65)).toBe(31000);
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

        // At age 35, limit is 23,500. Already contributed 20k, so max is 3,500
        const result = rule.getContributionAmount(10000, account, monthlyData, 35);

        expect(result.contributionAmount).toBe(3500);
      });
    });

    describe('IRA limits', () => {
      it('should enforce $7,000 limit for age under 50', () => {
        expect(getAnnualContributionLimit('iraCombined', 35)).toBe(7000);
        expect(getAnnualContributionLimit('iraCombined', 49)).toBe(7000);
      });

      it('should enforce $8,000 limit for age 50+', () => {
        expect(getAnnualContributionLimit('iraCombined', 50)).toBe(8000);
        expect(getAnnualContributionLimit('iraCombined', 65)).toBe(8000);
      });

      it('should share limit between traditional IRA and Roth IRA', () => {
        expect(sharedLimitAccounts['ira']).toContain('rothIra');
        expect(sharedLimitAccounts['rothIra']).toContain('ira');
      });
    });

    describe('HSA limits', () => {
      it('should enforce $4,300 limit for age under 55', () => {
        expect(getAnnualContributionLimit('hsa', 35)).toBe(4300);
        expect(getAnnualContributionLimit('hsa', 54)).toBe(4300);
      });

      it('should enforce $5,300 limit for age 55+', () => {
        expect(getAnnualContributionLimit('hsa', 55)).toBe(5300);
        expect(getAnnualContributionLimit('hsa', 65)).toBe(5300);
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
            taxExemptIncome: 0,
            socialSecurityIncome: 0,
          },
          'income-2': {
            id: 'income-2',
            name: 'Bonus',
            income: 2000,
            amountWithheld: 0,
            ficaTax: 0,
            incomeAfterPayrollDeductions: 2000,
            taxExemptIncome: 0,
            socialSecurityIncome: 0,
          },
          'income-3': {
            id: 'income-3',
            name: 'Side Gig',
            income: 3000,
            amountWithheld: 0,
            ficaTax: 0,
            incomeAfterPayrollDeductions: 3000,
            taxExemptIncome: 0,
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

      // At age 35, limit is 23,500 for 401k+roth401k combined
      // Already contributed 20k to 401k, so roth401k can only get 3,500
      const result = rule.getContributionAmount(10000, account, monthlyData, 35);

      expect(result.contributionAmount).toBe(3500);
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

      // At age 35, IRA limit is 7,000 for IRA+rothIRA combined
      // Already contributed 5k to IRA, so Roth IRA can only get 2,000
      const result = rule.getContributionAmount(10000, account, monthlyData, 35);

      expect(result.contributionAmount).toBe(2000);
    });
  });
});
