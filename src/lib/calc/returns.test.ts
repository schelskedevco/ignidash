import { describe, it, expect, beforeEach } from 'vitest';

import { SavingsAccount, TaxDeferredAccount, TaxableBrokerageAccount, TaxFreeAccount } from './account';
import type { AssetReturnRates, AssetYieldRates } from './asset';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';

/**
 * Returns & Yields Tests
 *
 * Key distinction:
 * - Returns: Update portfolio balance (capital appreciation/depreciation)
 * - Yields: Do NOT update portfolio balance (dividend/interest income for tax purposes only)
 *
 * This distinction is critical for:
 * 1. Accurate portfolio value tracking (returns affect balance)
 * 2. Tax calculations (yields generate taxable income without changing balance)
 */

describe('Returns vs Yields - Balance Update Behavior', () => {
  describe('Savings Account', () => {
    let account: SavingsAccount;
    const accountInput: AccountInputs & { type: 'savings' } = {
      id: 'savings-1',
      name: 'Emergency Fund',
      type: 'savings',
      balance: 10000,
    };

    beforeEach(() => {
      account = new SavingsAccount(accountInput);
    });

    it('applyReturns SHOULD update balance', () => {
      const initialBalance = account.getBalance();
      const returns: AssetReturnRates = { stocks: 0, bonds: 0, cash: 0.01 }; // 1% cash return

      account.applyReturns(returns);

      expect(account.getBalance()).toBeCloseTo(initialBalance * 1.01);
      expect(account.getBalance()).not.toBe(initialBalance);
    });

    it('applyYields should NOT update balance', () => {
      const initialBalance = account.getBalance();
      const yields: AssetYieldRates = { stocks: 0, bonds: 0, cash: 0.01 }; // 1% cash yield

      account.applyYields(yields);

      expect(account.getBalance()).toBe(initialBalance);
    });

    it('yields should track cumulative amounts for tax purposes', () => {
      const yields: AssetYieldRates = { stocks: 0, bonds: 0, cash: 0.005 }; // 0.5% monthly yield

      // Apply yields multiple months
      account.applyYields(yields);
      account.applyYields(yields);
      account.applyYields(yields);

      const cumulativeYields = account.getCumulativeYields();
      // 3 months of 0.5% on $10,000 = $150
      expect(cumulativeYields.cash).toBeCloseTo(150);
      expect(cumulativeYields.stocks).toBe(0);
      expect(cumulativeYields.bonds).toBe(0);

      // Balance should remain unchanged
      expect(account.getBalance()).toBe(10000);
    });

    it('returns should track cumulative amounts', () => {
      const returns: AssetReturnRates = { stocks: 0, bonds: 0, cash: 0.01 }; // 1% monthly

      account.applyReturns(returns);
      const result = account.applyReturns(returns);

      // First month: $10,000 * 1.01 = $10,100
      // Second month: $10,100 * 1.01 = $10,201
      expect(account.getBalance()).toBeCloseTo(10201);
      expect(result.cumulativeReturns.cash).toBeCloseTo(201);
    });
  });

  describe('Tax-Deferred Investment Account (401k)', () => {
    let account: TaxDeferredAccount;
    const accountInput: AccountInputs & { type: '401k' } = {
      id: '401k-1',
      name: '401k',
      type: '401k',
      balance: 100000,
      percentBonds: 40, // 40% bonds, 60% stocks
    };

    beforeEach(() => {
      account = new TaxDeferredAccount(accountInput);
    });

    it('applyReturns SHOULD update balance', () => {
      const initialBalance = account.getBalance();
      const returns: AssetReturnRates = {
        stocks: 0.01, // 1% stock return
        bonds: 0.005, // 0.5% bond return
        cash: 0,
      };

      account.applyReturns(returns);

      // 60% stocks at 1% = 0.6%, 40% bonds at 0.5% = 0.2%
      // Total expected return: 0.8%
      expect(account.getBalance()).toBeCloseTo(initialBalance * 1.008);
      expect(account.getBalance()).not.toBe(initialBalance);
    });

    it('applyYields should NOT update balance', () => {
      const initialBalance = account.getBalance();
      const yields: AssetYieldRates = {
        stocks: 0.02, // 2% dividend yield
        bonds: 0.03, // 3% bond yield
        cash: 0,
      };

      account.applyYields(yields);

      expect(account.getBalance()).toBe(initialBalance);
    });

    it('yields should categorize by asset class for tax purposes', () => {
      const yields: AssetYieldRates = {
        stocks: 0.01, // 1% dividend yield
        bonds: 0.02, // 2% interest yield
        cash: 0,
      };

      const result = account.applyYields(yields);

      // 60% stocks at 1% = $600 dividend
      expect(result.yieldsForPeriod.stocks).toBeCloseTo(600);
      // 40% bonds at 2% = $800 interest
      expect(result.yieldsForPeriod.bonds).toBeCloseTo(800);

      // Balance unchanged
      expect(account.getBalance()).toBe(100000);
    });

    it('returns should update asset allocation percentages', () => {
      // Start with 40% bonds, 60% stocks
      const returns: AssetReturnRates = {
        stocks: 0.1, // 10% stock return (big gain)
        bonds: 0.01, // 1% bond return (small gain)
        cash: 0,
      };

      account.applyReturns(returns);

      // Initial: $60k stocks, $40k bonds
      // After: $66k stocks, $40.4k bonds
      // New total: $106,400
      // New bonds %: 40,400 / 106,400 = ~37.97%
      const data = account.getAccountData();
      expect(data.assetAllocation.bonds).toBeCloseTo(0.3797, 2);
      expect(data.assetAllocation.stocks).toBeCloseTo(0.6203, 2);
    });
  });

  describe('Taxable Brokerage Account', () => {
    let account: TaxableBrokerageAccount;
    const accountInput: AccountInputs & { type: 'taxableBrokerage' } = {
      id: 'taxable-1',
      name: 'Taxable Brokerage',
      type: 'taxableBrokerage',
      balance: 50000,
      percentBonds: 20,
      costBasis: 40000, // $10k in gains
    };

    beforeEach(() => {
      account = new TaxableBrokerageAccount(accountInput);
    });

    it('applyReturns SHOULD update balance', () => {
      const initialBalance = account.getBalance();
      const returns: AssetReturnRates = {
        stocks: 0.02,
        bonds: 0.01,
        cash: 0,
      };

      account.applyReturns(returns);

      // 80% stocks at 2% = 1.6%, 20% bonds at 1% = 0.2%
      // Total: 1.8%
      expect(account.getBalance()).toBeCloseTo(initialBalance * 1.018);
    });

    it('applyYields should NOT update balance', () => {
      const initialBalance = account.getBalance();
      const yields: AssetYieldRates = {
        stocks: 0.015,
        bonds: 0.025,
        cash: 0,
      };

      account.applyYields(yields);

      expect(account.getBalance()).toBe(initialBalance);
    });

    it('yields are taxable in taxable accounts', () => {
      const yields: AssetYieldRates = {
        stocks: 0.01, // dividends
        bonds: 0.02, // interest
        cash: 0,
      };

      const result = account.applyYields(yields);

      // 80% stocks at 1% = $400 dividends
      expect(result.yieldsForPeriod.stocks).toBeCloseTo(400);
      // 20% bonds at 2% = $200 interest
      expect(result.yieldsForPeriod.bonds).toBeCloseTo(200);

      // These yields would be used downstream for tax calculations
      // but don't affect the account balance
      expect(account.getBalance()).toBe(50000);
    });
  });

  describe('Roth Account (Tax-Free)', () => {
    let account: TaxFreeAccount;
    const accountInput: AccountInputs & { type: 'rothIra' } = {
      id: 'roth-1',
      name: 'Roth IRA',
      type: 'rothIra',
      balance: 30000,
      percentBonds: 30,
      contributionBasis: 25000,
    };

    beforeEach(() => {
      account = new TaxFreeAccount(accountInput);
    });

    it('applyReturns SHOULD update balance', () => {
      const initialBalance = account.getBalance();
      const returns: AssetReturnRates = {
        stocks: 0.015,
        bonds: 0.008,
        cash: 0,
      };

      account.applyReturns(returns);

      // 70% stocks at 1.5% = 1.05%, 30% bonds at 0.8% = 0.24%
      // Total: 1.29%
      expect(account.getBalance()).toBeCloseTo(initialBalance * 1.0129);
    });

    it('applyYields should NOT update balance', () => {
      const initialBalance = account.getBalance();
      const yields: AssetYieldRates = {
        stocks: 0.02,
        bonds: 0.03,
        cash: 0,
      };

      account.applyYields(yields);

      expect(account.getBalance()).toBe(initialBalance);
    });

    it('yields in tax-free accounts are tracked but not taxed', () => {
      const yields: AssetYieldRates = {
        stocks: 0.01,
        bonds: 0.02,
        cash: 0,
      };

      const result = account.applyYields(yields);

      // Yields are calculated
      expect(result.yieldsForPeriod.stocks).toBeCloseTo(210); // 70% of $30k at 1%
      expect(result.yieldsForPeriod.bonds).toBeCloseTo(180); // 30% of $30k at 2%

      // But in tax-free accounts, these don't generate taxable income
      // The taxCategory 'taxFree' indicates no tax liability
      expect(account.taxCategory).toBe('taxFree');
    });
  });
});

describe('Monthly to Annual Return/Yield Conversion', () => {
  it('monthly returns compound to give correct annual return', () => {
    // Test the formula: monthly = (1 + annual)^(1/12) - 1
    const annualReturn = 0.08; // 8% annual
    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;

    // Compound for 12 months
    let balance = 10000;
    for (let i = 0; i < 12; i++) {
      balance *= 1 + monthlyReturn;
    }

    // Should equal ~10,800 (8% annual growth)
    expect(balance).toBeCloseTo(10000 * 1.08, 2);
  });

  it('monthly yield rates sum to give annual yield', () => {
    // Yields use simple division, not compounding
    const annualYield = 0.03; // 3% annual dividend yield
    const monthlyYield = annualYield / 12;

    // Sum 12 months
    let totalYield = 0;
    for (let i = 0; i < 12; i++) {
      totalYield += monthlyYield;
    }

    expect(totalYield).toBeCloseTo(annualYield);
  });
});

describe('Returns and Yields Integration', () => {
  it('applying both returns and yields updates balance correctly', () => {
    const account = new TaxDeferredAccount({
      id: 'test-401k',
      name: 'Test 401k',
      type: '401k',
      balance: 100000,
      percentBonds: 50,
    });

    const returns: AssetReturnRates = { stocks: 0.01, bonds: 0.005, cash: 0 };
    const yields: AssetYieldRates = { stocks: 0.01, bonds: 0.02, cash: 0 };

    // Apply yields first (shouldn't change balance)
    account.applyYields(yields);
    expect(account.getBalance()).toBe(100000);

    // Apply returns (should change balance)
    account.applyReturns(returns);
    // 50% stocks at 1% + 50% bonds at 0.5% = 0.75%
    expect(account.getBalance()).toBeCloseTo(100750);
  });

  it('cumulative tracking is separate for returns and yields', () => {
    const account = new TaxDeferredAccount({
      id: 'test-401k',
      name: 'Test 401k',
      type: '401k',
      balance: 100000,
      percentBonds: 50,
    });

    const returns: AssetReturnRates = { stocks: 0.01, bonds: 0.005, cash: 0 };
    const yields: AssetYieldRates = { stocks: 0.002, bonds: 0.003, cash: 0 };

    // Apply both
    const returnResult = account.applyReturns(returns);
    const yieldResult = account.applyYields(yields);

    // Returns: 50k stocks * 1% = 500, 50k bonds * 0.5% = 250
    expect(returnResult.cumulativeReturns.stocks).toBeCloseTo(500);
    expect(returnResult.cumulativeReturns.bonds).toBeCloseTo(250);

    // After returns, balance is 100750, allocation shifted slightly
    // New stocks value: ~50500, new bonds value: ~50250
    // Yields are calculated on current (post-return) allocation
    // Using toBeCloseTo with -1 numDigits (10s precision) since exact values depend on allocation drift
    expect(yieldResult.cumulativeYields.stocks).toBeCloseTo(101, -1);
    expect(yieldResult.cumulativeYields.bonds).toBeCloseTo(151, -1);
  });
});

describe('Yield Tax Categories', () => {
  it('yields are categorized by account tax treatment', () => {
    // Create accounts with different tax treatments
    const taxableAccount = new TaxableBrokerageAccount({
      id: 'taxable',
      name: 'Taxable',
      type: 'taxableBrokerage',
      balance: 10000,
      percentBonds: 0,
      costBasis: 10000,
    });

    const taxDeferredAccount = new TaxDeferredAccount({
      id: 'deferred',
      name: '401k',
      type: '401k',
      balance: 10000,
      percentBonds: 0,
    });

    const taxFreeAccount = new TaxFreeAccount({
      id: 'free',
      name: 'Roth',
      type: 'rothIra',
      balance: 10000,
      percentBonds: 0,
      contributionBasis: 10000,
    });

    const savingsAccount = new SavingsAccount({
      id: 'savings',
      name: 'Savings',
      type: 'savings',
      balance: 10000,
    });

    // Tax categories determine how yields are taxed
    expect(taxableAccount.taxCategory).toBe('taxable');
    expect(taxDeferredAccount.taxCategory).toBe('taxDeferred');
    expect(taxFreeAccount.taxCategory).toBe('taxFree');
    expect(savingsAccount.taxCategory).toBe('cashSavings');

    // In actual tax processing:
    // - 'taxable': Dividends/interest taxed annually
    // - 'taxDeferred': Not taxed until withdrawn
    // - 'taxFree': Never taxed (Roth)
    // - 'cashSavings': Interest taxed as ordinary income
  });
});

describe('Zero and Negative Returns', () => {
  it('handles zero returns correctly', () => {
    const account = new TaxDeferredAccount({
      id: 'test',
      name: 'Test',
      type: '401k',
      balance: 100000,
      percentBonds: 50,
    });

    const returns: AssetReturnRates = { stocks: 0, bonds: 0, cash: 0 };
    account.applyReturns(returns);

    expect(account.getBalance()).toBe(100000);
  });

  it('handles negative returns (market losses)', () => {
    const account = new TaxDeferredAccount({
      id: 'test',
      name: 'Test',
      type: '401k',
      balance: 100000,
      percentBonds: 50,
    });

    const returns: AssetReturnRates = {
      stocks: -0.1, // 10% loss
      bonds: -0.02, // 2% loss
      cash: 0,
    };

    account.applyReturns(returns);

    // 50% stocks at -10% = -5%, 50% bonds at -2% = -1%
    // Total: -6%
    expect(account.getBalance()).toBeCloseTo(94000);
  });

  it('cumulative returns can be negative', () => {
    const account = new TaxDeferredAccount({
      id: 'test',
      name: 'Test',
      type: '401k',
      balance: 100000,
      percentBonds: 50,
    });

    const returns: AssetReturnRates = { stocks: -0.05, bonds: -0.01, cash: 0 };
    const result = account.applyReturns(returns);

    expect(result.cumulativeReturns.stocks).toBeLessThan(0);
    expect(result.cumulativeReturns.bonds).toBeLessThan(0);
  });
});
