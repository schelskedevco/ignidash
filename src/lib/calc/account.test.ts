import { describe, it, expect } from 'vitest';

import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';

import { SavingsAccount, TaxableBrokerageAccount, TaxDeferredAccount, TaxFreeAccount } from './account';

// ============================================================================
// Test Fixtures
// ============================================================================

const createSavingsAccount = (overrides?: Partial<AccountInputs & { type: 'savings' }>): AccountInputs & { type: 'savings' } => ({
  type: 'savings',
  id: overrides?.id ?? 'savings-1',
  name: overrides?.name ?? 'Savings Account',
  balance: overrides?.balance ?? 10000,
});

const create401kAccount = (overrides?: Partial<AccountInputs & { type: '401k' }>): AccountInputs & { type: '401k' } => ({
  type: '401k',
  id: overrides?.id ?? '401k-1',
  name: overrides?.name ?? '401k Account',
  balance: overrides?.balance ?? 100000,
  percentBonds: overrides?.percentBonds ?? 20,
});

const createRothIraAccount = (overrides?: Partial<AccountInputs & { type: 'rothIra' }>): AccountInputs & { type: 'rothIra' } => ({
  type: 'rothIra',
  id: overrides?.id ?? 'roth-1',
  name: overrides?.name ?? 'Roth IRA',
  balance: overrides?.balance ?? 50000,
  percentBonds: overrides?.percentBonds ?? 10,
  contributionBasis: overrides?.contributionBasis ?? 40000,
});

const createTaxableBrokerageAccount = (
  overrides?: Partial<AccountInputs & { type: 'taxableBrokerage' }>
): AccountInputs & { type: 'taxableBrokerage' } => ({
  type: 'taxableBrokerage',
  id: overrides?.id ?? 'taxable-1',
  name: overrides?.name ?? 'Taxable Brokerage',
  balance: overrides?.balance ?? 75000,
  percentBonds: overrides?.percentBonds ?? 15,
  costBasis: overrides?.costBasis ?? 50000,
});

const createHsaAccount = (overrides?: Partial<AccountInputs & { type: 'hsa' }>): AccountInputs & { type: 'hsa' } => ({
  type: 'hsa',
  id: overrides?.id ?? 'hsa-1',
  name: overrides?.name ?? 'HSA',
  balance: overrides?.balance ?? 20000,
  percentBonds: overrides?.percentBonds ?? 20,
});

const defaultAllocation = { stocks: 0.6, bonds: 0.4, cash: 0 };

// ============================================================================
// TaxableBrokerageAccount Cost Basis Tests
// ============================================================================

describe('TaxableBrokerageAccount', () => {
  describe('cost basis tracking', () => {
    it('should calculate realized gains as withdrawal minus proportional cost basis', () => {
      // Balance: 100k, Cost Basis: 60k, Gain in account: 40k (40%)
      const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount({ balance: 100000, costBasis: 60000 }));

      // Withdraw 50k -> proportional basis is 30k (50% of 60k)
      // Realized gain = 50k - 30k = 20k
      const result = account.applyWithdrawal(50000, 'regular', defaultAllocation);

      expect(result.realizedGains).toBe(20000);
      expect(account.getBalance()).toBe(50000);
      expect(account.getCostBasis()).toBe(30000);
    });

    it('should increase cost basis by contribution amount', () => {
      const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount({ balance: 50000, costBasis: 50000 }));

      account.applyContribution(10000, 'self', defaultAllocation);

      expect(account.getBalance()).toBe(60000);
      expect(account.getCostBasis()).toBe(60000);
    });

    it('should decrease cost basis proportionally on withdrawal', () => {
      // Balance: 80k, Cost Basis: 40k (50% of balance)
      const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount({ balance: 80000, costBasis: 40000 }));

      // Withdraw 20k (25% of balance)
      // Cost basis withdrawn = 20k * (40k / 80k) = 10k
      account.applyWithdrawal(20000, 'regular', defaultAllocation);

      expect(account.getBalance()).toBe(60000);
      expect(account.getCostBasis()).toBe(30000);
    });

    it('should accumulate realized gains cumulatively', () => {
      const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount({ balance: 100000, costBasis: 50000 }));

      // First withdrawal: 20k, gain = 10k (50% gain ratio)
      account.applyWithdrawal(20000, 'regular', defaultAllocation);
      expect(account.getCumulativeRealizedGains()).toBe(10000);

      // Second withdrawal: 20k, gain = 10k (same ratio maintained)
      account.applyWithdrawal(20000, 'regular', defaultAllocation);
      expect(account.getCumulativeRealizedGains()).toBe(20000);
    });

    it('should handle full withdrawal correctly', () => {
      const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount({ balance: 100000, costBasis: 60000 }));

      const result = account.applyWithdrawal(100000, 'regular', defaultAllocation);

      expect(result.realizedGains).toBe(40000);
      expect(account.getBalance()).toBe(0);
      expect(account.getCostBasis()).toBe(0);
    });

    it('should handle account with no gains (cost basis = balance)', () => {
      const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount({ balance: 50000, costBasis: 50000 }));

      const result = account.applyWithdrawal(25000, 'regular', defaultAllocation);

      expect(result.realizedGains).toBe(0);
      expect(account.getCostBasis()).toBe(25000);
    });

    it('should handle account with losses (cost basis > current balance)', () => {
      // This can happen after market losses
      const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount({ balance: 40000, costBasis: 50000 }));

      // Withdraw 20k, proportional basis = 20k * (50k/40k) = 25k
      // Realized loss = 20k - 25k = -5k
      const result = account.applyWithdrawal(20000, 'regular', defaultAllocation);

      expect(result.realizedGains).toBe(-5000);
    });
  });

  describe('rebalancing cost basis', () => {
    it('should update cost basis when rebalancing triggers realized gains', () => {
      const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount({ balance: 100000, costBasis: 60000, percentBonds: 20 }));

      // Rebalance: sell 30k of stocks excess
      const result = account.applyRebalance(30000, 0);

      // Selling 30k with 60% cost basis proportion = 18k basis sold
      // Realized gain = 30k - 18k = 12k
      expect(result.realizedGains).toBe(12000);
      // Cost basis increases by realized gain after rebalance (since money stays in account)
      expect(account.getCostBasis()).toBe(72000);
    });
  });
});

// ============================================================================
// TaxFreeAccount (Roth) Contribution Basis Tests
// ============================================================================

describe('TaxFreeAccount (Roth)', () => {
  describe('contribution basis tracking', () => {
    it('should track contribution basis separately from earnings', () => {
      const account = new TaxFreeAccount(createRothIraAccount({ balance: 50000, contributionBasis: 40000 }));

      // Earnings = balance - contribution basis = 10k
      expect(account.getBalance()).toBe(50000);
      expect(account.getContributionBasis()).toBe(40000);
    });

    it('should withdraw contributions first, then earnings', () => {
      const account = new TaxFreeAccount(createRothIraAccount({ balance: 50000, contributionBasis: 40000 }));

      // Withdraw 30k - all from contributions
      const result1 = account.applyWithdrawal(30000, 'regular', defaultAllocation);
      expect(result1.earningsWithdrawn).toBe(0);
      expect(account.getContributionBasis()).toBe(10000);

      // Withdraw another 15k - 10k from contributions, 5k from earnings
      const result2 = account.applyWithdrawal(15000, 'regular', defaultAllocation);
      expect(result2.earningsWithdrawn).toBe(5000);
      expect(account.getContributionBasis()).toBe(0);
    });

    it('should calculate earnings withdrawn correctly', () => {
      const account = new TaxFreeAccount(createRothIraAccount({ balance: 60000, contributionBasis: 40000 }));

      // Withdraw all 60k - 40k contributions, 20k earnings
      const result = account.applyWithdrawal(60000, 'regular', defaultAllocation);

      expect(result.earningsWithdrawn).toBe(20000);
      expect(account.getContributionBasis()).toBe(0);
    });

    it('should increase contribution basis on new contributions', () => {
      const account = new TaxFreeAccount(createRothIraAccount({ balance: 50000, contributionBasis: 40000 }));

      account.applyContribution(7000, 'self', defaultAllocation);

      expect(account.getBalance()).toBe(57000);
      expect(account.getContributionBasis()).toBe(47000);
    });

    it('should never have negative contribution basis', () => {
      const account = new TaxFreeAccount(createRothIraAccount({ balance: 50000, contributionBasis: 10000 }));

      // Withdraw more than contribution basis
      const result = account.applyWithdrawal(30000, 'regular', defaultAllocation);

      expect(result.earningsWithdrawn).toBe(20000);
      expect(account.getContributionBasis()).toBe(0);
    });

    it('should track cumulative earnings withdrawn', () => {
      const account = new TaxFreeAccount(createRothIraAccount({ balance: 80000, contributionBasis: 50000 }));

      // First withdrawal: deplete contributions and some earnings
      account.applyWithdrawal(60000, 'regular', defaultAllocation);
      expect(account.getCumulativeEarningsWithdrawn()).toBe(10000);

      // Second withdrawal: only earnings left
      account.applyWithdrawal(15000, 'regular', defaultAllocation);
      expect(account.getCumulativeEarningsWithdrawn()).toBe(25000);
    });

    it('should handle employer contributions to contribution basis', () => {
      const account = new TaxFreeAccount(createRothIraAccount({ balance: 50000, contributionBasis: 40000 }));

      // Employer match also increases contribution basis
      account.applyContribution(5000, 'employer', defaultAllocation);

      expect(account.getBalance()).toBe(55000);
      expect(account.getContributionBasis()).toBe(45000);
    });
  });
});

// ============================================================================
// Investment Account Allocation Tests
// ============================================================================

describe('InvestmentAccount allocation tracking', () => {
  describe('percent bonds updates after returns', () => {
    it('should update allocation when stock and bond returns differ', () => {
      // 80k stocks (80%), 20k bonds (20%)
      const account = new TaxDeferredAccount(create401kAccount({ balance: 100000, percentBonds: 20 }));

      // Stocks return 10%, bonds return 2%
      // New stocks: 80k * 1.10 = 88k
      // New bonds: 20k * 1.02 = 20.4k
      // Total: 108.4k
      // New bond %: 20.4 / 108.4 = 18.82%
      account.applyReturns({ stocks: 0.1, bonds: 0.02, cash: 0 });

      const allocation = account.getAccountData().assetAllocation;
      expect(allocation.bonds).toBeCloseTo(0.1882, 3);
      expect(allocation.stocks).toBeCloseTo(0.8118, 3);
    });
  });

  describe('percent bonds updates after contributions', () => {
    it('should update allocation after contribution with different allocation', () => {
      // Start: 80k stocks, 20k bonds (20% bonds)
      const account = new TaxDeferredAccount(create401kAccount({ balance: 100000, percentBonds: 20 }));

      // Contribute 20k with 50/50 allocation
      account.applyContribution(20000, 'self', { stocks: 0.5, bonds: 0.5, cash: 0 });

      // New: 80k + 10k stocks = 90k, 20k + 10k bonds = 30k
      // Total: 120k
      // Bond %: 30/120 = 25%
      const allocation = account.getAccountData().assetAllocation;
      expect(allocation.bonds).toBeCloseTo(0.25, 3);
    });
  });

  describe('percent bonds updates after withdrawals', () => {
    it('should update allocation after withdrawal with different allocation', () => {
      // Start: 80k stocks, 20k bonds (20% bonds)
      const account = new TaxDeferredAccount(create401kAccount({ balance: 100000, percentBonds: 20 }));

      // Withdraw 30k with 80% stocks, 20% bonds allocation
      // Withdraw: 24k stocks, 6k bonds
      account.applyWithdrawal(30000, 'regular', { stocks: 0.8, bonds: 0.2, cash: 0 });

      // New: 80k - 24k stocks = 56k, 20k - 6k bonds = 14k
      // Total: 70k
      // Bond %: 14/70 = 20%
      const allocation = account.getAccountData().assetAllocation;
      expect(allocation.bonds).toBeCloseTo(0.2, 3);
    });

    it('should handle withdrawal that depletes one asset class', () => {
      // Start: 80k stocks, 20k bonds (20% bonds)
      const account = new TaxDeferredAccount(create401kAccount({ balance: 100000, percentBonds: 20 }));

      // Try to withdraw 40k all from bonds (but only 20k bonds available)
      // Should withdraw 20k bonds, 20k stocks
      account.applyWithdrawal(40000, 'regular', { stocks: 0, bonds: 1, cash: 0 });

      // Result: 60k stocks, 0k bonds
      const allocation = account.getAccountData().assetAllocation;
      expect(account.getBalance()).toBe(60000);
      expect(allocation.bonds).toBe(0);
      expect(allocation.stocks).toBe(1);
    });
  });
});

// ============================================================================
// RMD Eligibility Tests
// ============================================================================

describe('RMD eligibility', () => {
  it('should have RMDs for 401k', () => {
    const account = new TaxDeferredAccount(create401kAccount());
    expect(account.getHasRMDs()).toBe(true);
  });

  it('should have RMDs for traditional IRA', () => {
    const account = new TaxDeferredAccount({
      type: 'ira',
      id: 'ira-1',
      name: 'IRA',
      balance: 50000,
      percentBonds: 20,
    });
    expect(account.getHasRMDs()).toBe(true);
  });

  it('should have RMDs for 403b', () => {
    const account = new TaxDeferredAccount({
      type: '403b',
      id: '403b-1',
      name: '403b',
      balance: 50000,
      percentBonds: 20,
    });
    expect(account.getHasRMDs()).toBe(true);
  });

  it('should NOT have RMDs for Roth IRA', () => {
    const account = new TaxFreeAccount(createRothIraAccount());
    expect(account.getHasRMDs()).toBe(false);
  });

  it('should NOT have RMDs for Roth 401k', () => {
    const account = new TaxFreeAccount({
      type: 'roth401k',
      id: 'roth401k-1',
      name: 'Roth 401k',
      balance: 50000,
      percentBonds: 20,
      contributionBasis: 40000,
    });
    expect(account.getHasRMDs()).toBe(false);
  });

  it('should NOT have RMDs for HSA', () => {
    const account = new TaxDeferredAccount(createHsaAccount());
    expect(account.getHasRMDs()).toBe(false);
  });

  it('should NOT have RMDs for savings', () => {
    const account = new SavingsAccount(createSavingsAccount());
    expect(account.getHasRMDs()).toBe(false);
  });

  it('should NOT have RMDs for taxable brokerage', () => {
    const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount());
    expect(account.getHasRMDs()).toBe(false);
  });
});

// ============================================================================
// Tax Category Tests
// ============================================================================

describe('tax categories', () => {
  it('should categorize savings as cashSavings', () => {
    const account = new SavingsAccount(createSavingsAccount());
    expect(account.taxCategory).toBe('cashSavings');
  });

  it('should categorize taxable brokerage as taxable', () => {
    const account = new TaxableBrokerageAccount(createTaxableBrokerageAccount());
    expect(account.taxCategory).toBe('taxable');
  });

  it('should categorize 401k as taxDeferred', () => {
    const account = new TaxDeferredAccount(create401kAccount());
    expect(account.taxCategory).toBe('taxDeferred');
  });

  it('should categorize IRA as taxDeferred', () => {
    const account = new TaxDeferredAccount({
      type: 'ira',
      id: 'ira-1',
      name: 'IRA',
      balance: 50000,
      percentBonds: 20,
    });
    expect(account.taxCategory).toBe('taxDeferred');
  });

  it('should categorize HSA as taxDeferred', () => {
    const account = new TaxDeferredAccount(createHsaAccount());
    expect(account.taxCategory).toBe('taxDeferred');
  });

  it('should categorize Roth IRA as taxFree', () => {
    const account = new TaxFreeAccount(createRothIraAccount());
    expect(account.taxCategory).toBe('taxFree');
  });

  it('should categorize Roth 401k as taxFree', () => {
    const account = new TaxFreeAccount({
      type: 'roth401k',
      id: 'roth401k-1',
      name: 'Roth 401k',
      balance: 50000,
      percentBonds: 20,
      contributionBasis: 40000,
    });
    expect(account.taxCategory).toBe('taxFree');
  });
});

// ============================================================================
// Cumulative Tracking Tests
// ============================================================================

describe('cumulative tracking', () => {
  it('should track cumulative contributions', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 50000 }));

    account.applyContribution(5000, 'self', defaultAllocation);
    account.applyContribution(3000, 'self', defaultAllocation);

    const cumulative = account.getCumulativeContributions();
    expect(cumulative.stocks + cumulative.bonds).toBeCloseTo(8000, 0);
  });

  it('should track cumulative employer match separately', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 50000 }));

    account.applyContribution(5000, 'self', defaultAllocation);
    account.applyContribution(2500, 'employer', defaultAllocation);
    account.applyContribution(3000, 'self', defaultAllocation);

    expect(account.getCumulativeEmployerMatch()).toBe(2500);
  });

  it('should track cumulative withdrawals', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 100000 }));

    account.applyWithdrawal(10000, 'regular', defaultAllocation);
    account.applyWithdrawal(5000, 'regular', defaultAllocation);

    const cumulative = account.getCumulativeWithdrawals();
    expect(cumulative.stocks + cumulative.bonds).toBeCloseTo(15000, 0);
  });

  it('should track cumulative RMDs', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 100000 }));

    account.applyWithdrawal(4000, 'rmd', defaultAllocation);
    account.applyWithdrawal(4200, 'rmd', defaultAllocation);

    expect(account.getCumulativeRmds()).toBeCloseTo(8200, 0);
  });

  it('should track cumulative returns', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 100000, percentBonds: 20 }));

    // First month returns
    account.applyReturns({ stocks: 0.01, bonds: 0.005, cash: 0 });
    // Second month returns
    account.applyReturns({ stocks: 0.02, bonds: 0.003, cash: 0 });

    const cumulative = account.getCumulativeReturns();
    expect(cumulative.stocks).toBeGreaterThan(0);
    expect(cumulative.bonds).toBeGreaterThan(0);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('should handle zero balance account', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 0 }));

    expect(account.getBalance()).toBe(0);
    expect(() => account.applyReturns({ stocks: 0.1, bonds: 0.05, cash: 0 })).not.toThrow();
  });

  it('should throw on negative contribution', () => {
    const account = new TaxDeferredAccount(create401kAccount());

    expect(() => account.applyContribution(-1000, 'self', defaultAllocation)).toThrow();
  });

  it('should throw on negative withdrawal', () => {
    const account = new TaxDeferredAccount(create401kAccount());

    expect(() => account.applyWithdrawal(-1000, 'regular', defaultAllocation)).toThrow();
  });

  it('should throw on withdrawal exceeding balance', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 1000 }));

    expect(() => account.applyWithdrawal(2000, 'regular', defaultAllocation)).toThrow();
  });

  it('should handle zero contribution gracefully', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 50000 }));

    const result = account.applyContribution(0, 'self', defaultAllocation);

    expect(result.stocks).toBe(0);
    expect(result.bonds).toBe(0);
    expect(account.getBalance()).toBe(50000);
  });

  it('should handle zero withdrawal gracefully', () => {
    const account = new TaxDeferredAccount(create401kAccount({ balance: 50000 }));

    const result = account.applyWithdrawal(0, 'regular', defaultAllocation);

    expect(result.stocks).toBe(0);
    expect(result.bonds).toBe(0);
    expect(account.getBalance()).toBe(50000);
  });
});
