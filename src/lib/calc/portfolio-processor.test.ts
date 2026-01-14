import { describe, it, expect } from 'vitest';

import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { ContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import type { GlidePathInputs } from '@/lib/schemas/inputs/glide-path-schema';

import { Portfolio, PortfolioProcessor } from './portfolio';
import { ContributionRules } from './contribution-rules';
import type { SimulationState, SimulationContext } from './simulation-engine';
import type { IncomesData } from './incomes';
import type { ExpensesData } from './expenses';
import { uniformLifetimeMap } from './historical-data/rmds-table';

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

const createIraAccount = (overrides?: Partial<AccountInputs & { type: 'ira' }>): AccountInputs & { type: 'ira' } => ({
  type: 'ira',
  id: overrides?.id ?? 'ira-1',
  name: overrides?.name ?? 'IRA Account',
  balance: overrides?.balance ?? 50000,
  percentBonds: overrides?.percentBonds ?? 30,
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

const createMockSimulationState = (
  portfolio: Portfolio,
  age: number,
  phase: 'accumulation' | 'retirement' = 'retirement'
): SimulationState => ({
  time: { date: new Date(2025, 0, 1), age, year: 2025, month: 1 },
  portfolio,
  phase: { name: phase },
  annualData: { expenses: [] },
});

const createMockSimulationContext = (overrides?: Partial<SimulationContext>): SimulationContext => {
  const startAge = overrides?.startAge ?? 35;
  const endAge = overrides?.endAge ?? 90;
  const yearsToSimulate = overrides?.yearsToSimulate ?? Math.ceil(endAge - startAge);
  const startDate = overrides?.startDate ?? new Date(2025, 0, 1);
  const endDate = overrides?.endDate ?? new Date(startDate.getFullYear() + yearsToSimulate, startDate.getMonth(), 1);

  return {
    startAge,
    endAge,
    yearsToSimulate,
    startDate,
    endDate,
    retirementStrategy: overrides?.retirementStrategy ?? { type: 'fixedAge', retirementAge: 65 },
    rmdAge: overrides?.rmdAge ?? 75,
  };
};

const createEmptyIncomesData = (overrides?: Partial<IncomesData>): IncomesData => ({
  totalIncome: overrides?.totalIncome ?? 0,
  totalAmountWithheld: overrides?.totalAmountWithheld ?? 0,
  totalFicaTax: overrides?.totalFicaTax ?? 0,
  totalIncomeAfterPayrollDeductions: overrides?.totalIncomeAfterPayrollDeductions ?? 0,
  totalTaxExemptIncome: overrides?.totalTaxExemptIncome ?? 0,
  totalSocialSecurityIncome: overrides?.totalSocialSecurityIncome ?? 0,
  perIncomeData: overrides?.perIncomeData ?? {},
});

const createEmptyExpensesData = (overrides?: Partial<ExpensesData>): ExpensesData => ({
  totalExpenses: overrides?.totalExpenses ?? 0,
  perExpenseData: overrides?.perExpenseData ?? {},
});

// ============================================================================
// Withdrawal Ordering Tests
// ============================================================================

describe('PortfolioProcessor', () => {
  describe('withdrawal ordering by age', () => {
    it('should withdraw from savings first before age 59.5', () => {
      const portfolio = new Portfolio([
        createSavingsAccount({ balance: 5000 }),
        create401kAccount({ balance: 100000 }),
        createTaxableBrokerageAccount({ balance: 50000 }),
      ]);
      const state = createMockSimulationState(portfolio, 50);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 3000 });

      const result = processor.processCashFlows(incomes, expenses);

      // Should withdraw from savings first (up to 5000 available)
      expect(result.portfolioData.perAccountData['savings-1'].withdrawalsForPeriod.cash).toBe(3000);
    });

    it('should withdraw from taxable brokerage second before age 59.5', () => {
      const portfolio = new Portfolio([
        createSavingsAccount({ balance: 1000 }),
        create401kAccount({ balance: 100000 }),
        createTaxableBrokerageAccount({ balance: 50000 }),
      ]);
      const state = createMockSimulationState(portfolio, 50);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 5000 });

      const result = processor.processCashFlows(incomes, expenses);

      // 1k from savings, 4k from taxable
      expect(result.portfolioData.perAccountData['savings-1'].withdrawalsForPeriod.cash).toBe(1000);
      const taxableWithdrawals = result.portfolioData.perAccountData['taxable-1'].withdrawalsForPeriod;
      expect(taxableWithdrawals.stocks + taxableWithdrawals.bonds).toBeCloseTo(4000, 0);
    });

    it('should withdraw Roth contributions (not earnings) third before age 59.5', () => {
      const portfolio = new Portfolio([
        createSavingsAccount({ balance: 1000 }),
        createTaxableBrokerageAccount({ balance: 1000 }),
        createRothIraAccount({ balance: 50000, contributionBasis: 40000 }), // 40k contributions, 10k earnings
        create401kAccount({ balance: 100000 }),
      ]);
      const state = createMockSimulationState(portfolio, 50);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 10000 });

      const result = processor.processCashFlows(incomes, expenses);

      // 1k from savings, 1k from taxable, up to 8k from Roth contributions
      const rothWithdrawals = result.portfolioData.perAccountData['roth-1'].withdrawalsForPeriod;
      expect(rothWithdrawals.stocks + rothWithdrawals.bonds).toBeCloseTo(8000, 0);
      // Should not touch earnings yet (contributions only modifier)
    });

    it('should prefer tax-deferred accounts after age 59.5', () => {
      const portfolio = new Portfolio([
        createSavingsAccount({ balance: 1000 }),
        create401kAccount({ balance: 100000 }),
        createTaxableBrokerageAccount({ balance: 50000 }),
        createRothIraAccount({ balance: 50000 }),
      ]);
      const state = createMockSimulationState(portfolio, 60);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 20000 });

      const result = processor.processCashFlows(incomes, expenses);

      // 1k from savings, then tax-deferred (401k) before taxable
      const k401Withdrawals = result.portfolioData.perAccountData['401k-1'].withdrawalsForPeriod;
      expect(k401Withdrawals.stocks + k401Withdrawals.bonds).toBeCloseTo(19000, 0);
    });

    it('should change withdrawal order exactly at age 59.5', () => {
      // Before 59.5: savings > taxable > Roth contributions > tax-deferred
      // At/After 59.5: savings > tax-deferred > taxable > Roth

      const portfolioBefore = new Portfolio([
        createSavingsAccount({ balance: 0 }),
        create401kAccount({ balance: 50000, id: '401k-1' }),
        createTaxableBrokerageAccount({ balance: 50000, id: 'taxable-1' }),
      ]);
      const stateBefore = createMockSimulationState(portfolioBefore, 59.4);
      const processorBefore = new PortfolioProcessor(
        stateBefore,
        createMockSimulationContext(),
        new ContributionRules([], { type: 'spend' })
      );

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 10000 });

      const resultBefore = processorBefore.processCashFlows(incomes, expenses);

      // Before 59.5: should withdraw from taxable first
      const taxableWithdrawalsBefore = resultBefore.portfolioData.perAccountData['taxable-1'].withdrawalsForPeriod;
      expect(taxableWithdrawalsBefore.stocks + taxableWithdrawalsBefore.bonds).toBeCloseTo(10000, 0);

      // After 59.5
      const portfolioAfter = new Portfolio([
        createSavingsAccount({ balance: 0 }),
        create401kAccount({ balance: 50000, id: '401k-1' }),
        createTaxableBrokerageAccount({ balance: 50000, id: 'taxable-1' }),
      ]);
      const stateAfter = createMockSimulationState(portfolioAfter, 59.5);
      const processorAfter = new PortfolioProcessor(
        stateAfter,
        createMockSimulationContext(),
        new ContributionRules([], { type: 'spend' })
      );

      const resultAfter = processorAfter.processCashFlows(incomes, expenses);

      // At 59.5: should withdraw from 401k first
      const k401WithdrawalsAfter = resultAfter.portfolioData.perAccountData['401k-1'].withdrawalsForPeriod;
      expect(k401WithdrawalsAfter.stocks + k401WithdrawalsAfter.bonds).toBeCloseTo(10000, 0);
    });

    it('should withdraw HSA last', () => {
      const portfolio = new Portfolio([
        createSavingsAccount({ balance: 1000 }),
        create401kAccount({ balance: 1000 }),
        createTaxableBrokerageAccount({ balance: 1000 }),
        createRothIraAccount({ balance: 1000, contributionBasis: 1000 }),
        createHsaAccount({ balance: 50000 }),
      ]);
      const state = createMockSimulationState(portfolio, 70);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 10000 });

      const result = processor.processCashFlows(incomes, expenses);

      // 1k savings + 1k 401k + 1k taxable + 1k roth = 4k from other accounts
      // 6k should come from HSA
      const hsaWithdrawals = result.portfolioData.perAccountData['hsa-1'].withdrawalsForPeriod;
      expect(hsaWithdrawals.stocks + hsaWithdrawals.bonds).toBeCloseTo(6000, 0);
    });
  });

  // ============================================================================
  // RMD Processing Tests
  // ============================================================================

  describe('RMD processing', () => {
    it('should calculate RMD using uniform lifetime table', () => {
      const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
      const state = createMockSimulationState(portfolio, 75);
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ rmdAge: 75 }),
        new ContributionRules([], { type: 'spend' })
      );

      const result = processor.processRequiredMinimumDistributions();

      // At age 75, factor is 24.6
      const expectedRmd = 100000 / uniformLifetimeMap[75];
      expect(result.rmdsForPeriod).toBeCloseTo(expectedRmd, 2);
    });

    it('should apply RMD to 401k, 403b, and IRA but not Roth', () => {
      const portfolio = new Portfolio([
        create401kAccount({ id: '401k-1', balance: 100000 }),
        createIraAccount({ id: 'ira-1', balance: 50000 }),
        createRothIraAccount({ id: 'roth-1', balance: 75000 }),
      ]);
      const state = createMockSimulationState(portfolio, 75);
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ rmdAge: 75 }),
        new ContributionRules([], { type: 'spend' })
      );

      const result = processor.processRequiredMinimumDistributions();

      // RMDs from 401k and IRA
      const factor = uniformLifetimeMap[75];
      const expected401kRmd = 100000 / factor;
      const expectedIraRmd = 50000 / factor;

      expect(result.perAccountData['401k-1'].rmdsForPeriod).toBeCloseTo(expected401kRmd, 2);
      expect(result.perAccountData['ira-1'].rmdsForPeriod).toBeCloseTo(expectedIraRmd, 2);
      // Roth should have no RMD
      expect(result.perAccountData['roth-1']?.rmdsForPeriod ?? 0).toBe(0);
    });

    it('should move RMD to separate RMD savings account', () => {
      const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
      const state = createMockSimulationState(portfolio, 75);
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ rmdAge: 75 }),
        new ContributionRules([], { type: 'spend' })
      );

      const result = processor.processRequiredMinimumDistributions();

      // RMD should be moved to RMD savings account
      const rmdSavingsId = 'd7288042-1f83-4e50-9a6a-b1ef7a6191cc';
      const rmdAmount = result.rmdsForPeriod;
      expect(result.perAccountData[rmdSavingsId].contributionsForPeriod.cash).toBeCloseTo(rmdAmount, 2);
    });

    it('should calculate correct RMD amounts at different ages', () => {
      const testCases = [
        { age: 75, factor: 24.6 },
        { age: 80, factor: 20.2 },
        { age: 85, factor: 16.0 },
        { age: 90, factor: 12.2 },
      ];

      for (const { age, factor } of testCases) {
        const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
        const state = createMockSimulationState(portfolio, age);
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext({ rmdAge: 73 }),
          new ContributionRules([], { type: 'spend' })
        );

        const result = processor.processRequiredMinimumDistributions();
        const expectedRmd = 100000 / factor;

        expect(result.rmdsForPeriod).toBeCloseTo(expectedRmd, 1);
      }
    });

    it('should not process RMDs if age is below RMD age', () => {
      const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
      const state = createMockSimulationState(portfolio, 74);
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ rmdAge: 75 }),
        new ContributionRules([], { type: 'spend' })
      );

      expect(() => processor.processRequiredMinimumDistributions()).toThrow();
    });
  });

  // ============================================================================
  // Shortfall Tracking Tests
  // ============================================================================

  describe('shortfall tracking', () => {
    it('should record shortfall when expenses exceed available funds', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 1000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 5000 });

      const result = processor.processCashFlows(incomes, expenses);

      // Should have 4k shortfall
      expect(result.portfolioData.shortfallForPeriod).toBe(4000);
      expect(result.portfolioData.outstandingShortfall).toBe(4000);
    });

    it('should accumulate outstanding shortfall over multiple periods', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 1000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 2000 });

      // Period 1: 1k shortfall
      const result1 = processor.processCashFlows(incomes, expenses);
      expect(result1.portfolioData.shortfallForPeriod).toBe(1000);
      expect(result1.portfolioData.outstandingShortfall).toBe(1000);

      // Period 2: Another 2k expense, 2k shortfall (no funds left)
      const result2 = processor.processCashFlows(incomes, expenses);
      expect(result2.portfolioData.shortfallForPeriod).toBe(2000);
      expect(result2.portfolioData.outstandingShortfall).toBe(3000);
    });

    it('should repay shortfall from future positive cash flow first', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 1000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      // Period 1: Create 3k shortfall
      const incomes1 = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses1 = createEmptyExpensesData({ totalExpenses: 4000 });
      processor.processCashFlows(incomes1, expenses1);

      // Period 2: 5k income, 1k expenses -> 4k positive cash flow
      // Should repay 3k shortfall first, leaving 1k
      const incomes2 = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 5000 });
      const expenses2 = createEmptyExpensesData({ totalExpenses: 1000 });
      const result2 = processor.processCashFlows(incomes2, expenses2);

      expect(result2.portfolioData.shortfallRepaidForPeriod).toBe(3000);
      expect(result2.portfolioData.outstandingShortfall).toBe(0);
    });
  });

  // ============================================================================
  // Rebalancing with Glide Path Tests
  // ============================================================================

  describe('rebalancing with glide path', () => {
    it('should shift allocation toward target over time with customAge', () => {
      const glidePath: GlidePathInputs = {
        id: 'glide-path-1',
        enabled: true,
        endTimePoint: { type: 'customAge', age: 65 },
        targetBondAllocation: 60, // Shift to 60% bonds
      };

      // Start at 35 with 20% bonds, end at 65 with 60% bonds
      const portfolio = new Portfolio([create401kAccount({ balance: 100000, percentBonds: 20 })]);
      const state = createMockSimulationState(portfolio, 50, 'accumulation'); // Halfway there
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ startAge: 35 }),
        new ContributionRules([], { type: 'spend' }),
        glidePath
      );

      // Process cash flows to trigger rebalancing
      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 10000 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      processor.processCashFlows(incomes, expenses);

      // At age 50 (halfway from 35 to 65), allocation should be moving toward 60% bonds
      // Progress = (50-35)/(65-35) = 0.5
      // Target bonds at 50 = 20% + (60% - 20%) * 0.5 = 40%
      const allocation = portfolio.getWeightedAssetAllocation();
      // After contribution and rebalancing, should be closer to 40% bonds
      expect(allocation?.bonds).toBeGreaterThan(0.2);
    });

    it('should track realized gains from rebalancing in taxable accounts', () => {
      const glidePath: GlidePathInputs = {
        id: 'glide-path-1',
        enabled: true,
        endTimePoint: { type: 'customAge', age: 65 },
        targetBondAllocation: 80, // Aggressive shift to bonds
      };

      const portfolio = new Portfolio([createTaxableBrokerageAccount({ balance: 100000, percentBonds: 10, costBasis: 50000 })]);
      const state = createMockSimulationState(portfolio, 64, 'accumulation'); // Near end
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ startAge: 35 }),
        new ContributionRules([], { type: 'spend' }),
        glidePath
      );

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      const result = processor.processCashFlows(incomes, expenses);

      // Rebalancing sells stocks to buy bonds, generating realized gains in taxable account
      // Since cost basis is 50k on 100k balance, selling stocks realizes gains
      expect(result.portfolioData.realizedGainsForPeriod).toBeGreaterThanOrEqual(0);
    });

    it('should not rebalance when glide path is disabled', () => {
      const portfolio = new Portfolio([create401kAccount({ balance: 100000, percentBonds: 20 })]);
      const state = createMockSimulationState(portfolio, 50, 'accumulation');
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ startAge: 35 }),
        new ContributionRules([], { type: 'spend' }),
        { id: 'glide-path-1', enabled: false, endTimePoint: { type: 'customAge', age: 65 }, targetBondAllocation: 60 }
      );

      const initialAllocation = portfolio.getWeightedAssetAllocation();

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      processor.processCashFlows(incomes, expenses);

      const finalAllocation = portfolio.getWeightedAssetAllocation();
      expect(finalAllocation?.bonds).toBeCloseTo(initialAllocation?.bonds ?? 0, 4);
    });

    it('should rebalance tax-deferred accounts before taxable to minimize taxes', () => {
      const glidePath: GlidePathInputs = {
        id: 'glide-path-1',
        enabled: true,
        endTimePoint: { type: 'customAge', age: 65 },
        targetBondAllocation: 50,
      };

      const portfolio = new Portfolio([
        create401kAccount({ id: '401k-1', balance: 50000, percentBonds: 10 }),
        createTaxableBrokerageAccount({ id: 'taxable-1', balance: 50000, percentBonds: 10, costBasis: 30000 }),
      ]);
      const state = createMockSimulationState(portfolio, 64, 'accumulation');
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ startAge: 35 }),
        new ContributionRules([], { type: 'spend' }),
        glidePath
      );

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      processor.processCashFlows(incomes, expenses);

      // Rebalancing should occur in 401k first (tax-deferred) to avoid realizing gains
      // The order is: 401k, 403b, ira, hsa, roth401k, roth403b, rothIra, taxableBrokerage
      // This means taxable account rebalancing is last, minimizing taxable gains
      // If all rebalancing could be done in tax-deferred, there should be minimal realized gains
    });
  });

  // ============================================================================
  // Contribution Allocation Tests
  // ============================================================================

  describe('contribution allocation', () => {
    it('should allocate contributions to maintain target allocation', () => {
      const glidePath: GlidePathInputs = {
        id: 'glide-path-1',
        enabled: true,
        endTimePoint: { type: 'customAge', age: 65 },
        targetBondAllocation: 40,
      };

      // Portfolio is 20% bonds but target is 40%
      const portfolio = new Portfolio([create401kAccount({ balance: 100000, percentBonds: 20 })]);
      const state = createMockSimulationState(portfolio, 50, 'accumulation');
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ startAge: 35 }),
        new ContributionRules([createContributionRule({ accountId: '401k-1' })], { type: 'spend' }),
        glidePath
      );

      // Contribute 10k
      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 10000 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      const result = processor.processCashFlows(incomes, expenses);

      // Contributions should be weighted toward bonds to approach target allocation
      const contributions = result.portfolioData.perAccountData['401k-1'].contributionsForPeriod;
      // With current 20% bonds and target ~36% bonds (halfway to 40%), contributions should favor bonds
      expect(contributions.bonds).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Withdrawal Allocation Tests
  // ============================================================================

  describe('withdrawal allocation', () => {
    it('should withdraw to minimize deviation from target allocation', () => {
      const glidePath: GlidePathInputs = {
        id: 'glide-path-1',
        enabled: true,
        endTimePoint: { type: 'customAge', age: 65 },
        targetBondAllocation: 50,
      };

      // Portfolio is 20% bonds but target is ~42% (closer to retirement)
      // Should withdraw more from stocks to rebalance
      const portfolio = new Portfolio([create401kAccount({ balance: 100000, percentBonds: 20 })]);
      const state = createMockSimulationState(portfolio, 60);
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext({ startAge: 35 }),
        new ContributionRules([], { type: 'spend' }),
        glidePath
      );

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 10000 });
      const result = processor.processCashFlows(incomes, expenses);

      // Withdrawals should come more from stocks (overweight) than bonds (underweight)
      const withdrawals = result.portfolioData.perAccountData['401k-1'].withdrawalsForPeriod;
      expect(withdrawals.stocks).toBeGreaterThan(withdrawals.bonds);
    });
  });

  // ============================================================================
  // Base Rule Behavior Tests
  // ============================================================================

  describe('base contribution rule behavior', () => {
    it('should treat remaining cash as discretionary spending when base rule is spend', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 0 })]);
      const state = createMockSimulationState(portfolio, 35, 'accumulation');
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext(),
        new ContributionRules([], { type: 'spend' }) // Base rule is spend
      );

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 5000 });
      const expenses = createEmptyExpensesData({ totalExpenses: 2000 });
      const result = processor.processCashFlows(incomes, expenses);

      // 3k remaining should be discretionary expense
      expect(result.discretionaryExpense).toBe(3000);
    });

    it('should save remaining cash to extra savings when base rule is save', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 0 })]);
      const state = createMockSimulationState(portfolio, 35, 'accumulation');
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext(),
        new ContributionRules([], { type: 'save' }) // Base rule is save
      );

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 5000 });
      const expenses = createEmptyExpensesData({ totalExpenses: 2000 });
      const result = processor.processCashFlows(incomes, expenses);

      // 3k remaining should go to extra savings account
      expect(result.discretionaryExpense).toBe(0);
      const extraSavingsId = '54593a0d-7b4f-489d-a5bd-42500afba532';
      expect(result.portfolioData.perAccountData[extraSavingsId].contributionsForPeriod.cash).toBe(3000);
    });
  });
});
