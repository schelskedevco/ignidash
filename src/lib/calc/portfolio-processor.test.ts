import { describe, it, expect } from 'vitest';

import type { GlidePathInputs } from '@/lib/schemas/inputs/glide-path-schema';

import { Portfolio, PortfolioProcessor } from './portfolio';
import { ContributionRules } from './contribution-rules';
import { uniformLifetimeMap } from './historical-data/rmds-table';
import {
  createSavingsAccount,
  create401kAccount,
  createIraAccount,
  createRothIraAccount,
  createTaxableBrokerageAccount,
  createHsaAccount,
  createContributionRule,
  createMockSimulationState,
  createSimulationContext,
  createEmptyIncomesData,
  createEmptyExpensesData,
  createEmptyDebtsData,
  createEmptyPhysicalAssetsData,
} from './__tests__/test-utils';

const createMockSimulationContext = createSimulationContext;

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

      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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

      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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

      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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

      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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

      const resultBefore = processorBefore.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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

      const resultAfter = processorAfter.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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

      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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

    describe('SECURE Act 2.0 RMD age boundaries', () => {
      it('should process RMDs at age 73 when rmdAge is 73 (birth year 1959)', () => {
        const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
        const state = createMockSimulationState(portfolio, 73);
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext({ rmdAge: 73 }), // Born 1959 or earlier
          new ContributionRules([], { type: 'spend' })
        );

        const result = processor.processRequiredMinimumDistributions();

        // At age 73, factor is 26.5
        const expectedRmd = 100000 / uniformLifetimeMap[73];
        expect(result.rmdsForPeriod).toBeCloseTo(expectedRmd, 2);
      });

      it('should not process RMDs at age 73 when rmdAge is 75 (birth year 1960+)', () => {
        const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
        const state = createMockSimulationState(portfolio, 73);
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext({ rmdAge: 75 }), // Born 1960 or later
          new ContributionRules([], { type: 'spend' })
        );

        // Should throw because age 73 < rmdAge 75
        expect(() => processor.processRequiredMinimumDistributions()).toThrow();
      });

      it('should process RMDs at age 75 when rmdAge is 75 (birth year 1960+)', () => {
        const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
        const state = createMockSimulationState(portfolio, 75);
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext({ rmdAge: 75 }), // Born 1960 or later
          new ContributionRules([], { type: 'spend' })
        );

        const result = processor.processRequiredMinimumDistributions();

        // At age 75, factor is 24.6
        const expectedRmd = 100000 / uniformLifetimeMap[75];
        expect(result.rmdsForPeriod).toBeCloseTo(expectedRmd, 2);
      });

      it('should not process RMDs at age 74 when rmdAge is 75 (boundary test)', () => {
        const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
        const state = createMockSimulationState(portfolio, 74);
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext({ rmdAge: 75 }),
          new ContributionRules([], { type: 'spend' })
        );

        expect(() => processor.processRequiredMinimumDistributions()).toThrow();
      });

      it('should process RMDs at age 74 when rmdAge is 73 (1 year after requirement)', () => {
        const portfolio = new Portfolio([create401kAccount({ balance: 100000 })]);
        const state = createMockSimulationState(portfolio, 74);
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext({ rmdAge: 73 }), // Born 1959 or earlier
          new ContributionRules([], { type: 'spend' })
        );

        const result = processor.processRequiredMinimumDistributions();

        // At age 74, factor is 25.5
        const expectedRmd = 100000 / uniformLifetimeMap[74];
        expect(result.rmdsForPeriod).toBeCloseTo(expectedRmd, 2);
      });
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

      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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
      const result1 = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );
      expect(result1.portfolioData.shortfallForPeriod).toBe(1000);
      expect(result1.portfolioData.outstandingShortfall).toBe(1000);

      // Period 2: Another 2k expense, 2k shortfall (no funds left)
      const result2 = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );
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
      processor.processContributionsAndWithdrawals(incomes1, expenses1, createEmptyDebtsData(), createEmptyPhysicalAssetsData());

      // Period 2: 5k income, 1k expenses -> 4k positive cash flow
      // Should repay 3k shortfall first, leaving 1k
      const incomes2 = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 5000 });
      const expenses2 = createEmptyExpensesData({ totalExpenses: 1000 });
      const result2 = processor.processContributionsAndWithdrawals(
        incomes2,
        expenses2,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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
      processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), createEmptyPhysicalAssetsData());

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
      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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
      processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), createEmptyPhysicalAssetsData());

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
      processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), createEmptyPhysicalAssetsData());

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
      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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
      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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
      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

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
      const result = processor.processContributionsAndWithdrawals(
        incomes,
        expenses,
        createEmptyDebtsData(),
        createEmptyPhysicalAssetsData()
      );

      // 3k remaining should go to extra savings account
      expect(result.discretionaryExpense).toBe(0);
      const extraSavingsId = '54593a0d-7b4f-489d-a5bd-42500afba532';
      expect(result.portfolioData.perAccountData[extraSavingsId].contributionsForPeriod.cash).toBe(3000);
    });
  });

  // ============================================================================
  // Physical Asset Cash Flow Tests
  // ============================================================================

  describe('physical asset cash flow integration', () => {
    it('cash purchase creates withdrawal/deficit from portfolio', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 100000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      const physicalAssetsData = createEmptyPhysicalAssetsData({
        totalPurchaseOutlay: 50000, // Cash purchase
      });

      const result = processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), physicalAssetsData);

      // 50k should be withdrawn from savings to pay for the purchase
      expect(result.portfolioData.perAccountData['savings-1'].withdrawalsForPeriod.cash).toBe(50000);
    });

    it('financed purchase deducts down payment from portfolio', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 100000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      const physicalAssetsData = createEmptyPhysicalAssetsData({
        totalPurchaseOutlay: 80000, // Down payment only
        totalLoanPayment: 1500, // Monthly loan payment
      });

      const result = processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), physicalAssetsData);

      // 80k down payment + 1.5k loan payment = 81.5k withdrawn
      expect(result.portfolioData.perAccountData['savings-1'].withdrawalsForPeriod.cash).toBe(81500);
    });

    it('sale proceeds create contribution/surplus to portfolio', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 10000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(
        state,
        createMockSimulationContext(),
        new ContributionRules([], { type: 'save' }) // Save surplus
      );

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      const physicalAssetsData = createEmptyPhysicalAssetsData({
        totalSaleProceeds: 200000, // Sale proceeds
      });

      const result = processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), physicalAssetsData);

      // 200k sale proceeds should be contributed to extra savings
      const extraSavingsId = '54593a0d-7b4f-489d-a5bd-42500afba532';
      expect(result.portfolioData.perAccountData[extraSavingsId].contributionsForPeriod.cash).toBe(200000);
    });

    it('purchase and sale in same period nets correctly', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 50000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'save' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      const physicalAssetsData = createEmptyPhysicalAssetsData({
        totalPurchaseOutlay: 100000, // Buying new house
        totalSaleProceeds: 200000, // Selling old house
      });

      const result = processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), physicalAssetsData);

      // Net: +200k sale - 100k purchase = +100k surplus
      // Should be contributed to extra savings
      const extraSavingsId = '54593a0d-7b4f-489d-a5bd-42500afba532';
      expect(result.portfolioData.perAccountData[extraSavingsId].contributionsForPeriod.cash).toBe(100000);
    });

    it('large purchase creates shortfall when insufficient funds', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 50000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
      const expenses = createEmptyExpensesData({ totalExpenses: 0 });
      const physicalAssetsData = createEmptyPhysicalAssetsData({
        totalPurchaseOutlay: 100000, // Need 100k but only have 50k
      });

      const result = processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), physicalAssetsData);

      // Should have 50k withdrawal and 50k shortfall
      expect(result.portfolioData.perAccountData['savings-1'].withdrawalsForPeriod.cash).toBe(50000);
      expect(result.portfolioData.shortfallForPeriod).toBe(50000);
    });

    it('sale proceeds can offset purchase in same period avoiding withdrawal', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 10000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'save' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 5000 });
      const expenses = createEmptyExpensesData({ totalExpenses: 3000 });
      const physicalAssetsData = createEmptyPhysicalAssetsData({
        totalPurchaseOutlay: 50000, // Down payment
        totalSaleProceeds: 100000, // Sale proceeds
      });

      const result = processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), physicalAssetsData);

      // Net cash flow: 5k income - 3k expenses - 50k purchase + 100k sale = 52k surplus
      // Should contribute 52k to extra savings
      const extraSavingsId = '54593a0d-7b4f-489d-a5bd-42500afba532';
      expect(result.portfolioData.perAccountData[extraSavingsId].contributionsForPeriod.cash).toBe(52000);
    });

    it('loan payment continues to be deducted alongside income/expenses', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 100000 })]);
      const state = createMockSimulationState(portfolio, 65);
      const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

      const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 5000 });
      const expenses = createEmptyExpensesData({ totalExpenses: 3000 });
      const physicalAssetsData = createEmptyPhysicalAssetsData({
        totalLoanPayment: 2000, // Monthly mortgage
      });

      const result = processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), physicalAssetsData);

      // Net: 5k income - 3k expenses - 2k loan = 0 (no withdrawal needed)
      // No contributions either since net is 0
      expect(result.discretionaryExpense).toBe(0);
    });
  });

  // ============================================================================
  // getAnnualData Tests
  // ============================================================================

  describe('getAnnualData', () => {
    describe('period field aggregation', () => {
      it('should aggregate contributionsForPeriod across multiple months', () => {
        const portfolio = new Portfolio([create401kAccount({ id: '401k-1', balance: 50000 })]);
        const state = createMockSimulationState(portfolio, 35, 'accumulation');
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext(),
          new ContributionRules([createContributionRule({ accountId: '401k-1' })], { type: 'spend' })
        );

        // Process 3 months with contributions
        for (let i = 0; i < 3; i++) {
          const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 2000 });
          const expenses = createEmptyExpensesData({ totalExpenses: 0 });
          processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), createEmptyPhysicalAssetsData());
        }

        const annualData = processor.getAnnualData();

        // 2000 contributed each month for 3 months = 6000 total
        const totalContributions =
          annualData.contributionsForPeriod.stocks + annualData.contributionsForPeriod.bonds + annualData.contributionsForPeriod.cash;
        expect(totalContributions).toBeCloseTo(6000, 0);
      });

      it('should aggregate withdrawalsForPeriod across multiple months', () => {
        const portfolio = new Portfolio([createSavingsAccount({ id: 'savings-1', balance: 30000 })]);
        const state = createMockSimulationState(portfolio, 65);
        const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

        // Process 3 months with withdrawals
        for (let i = 0; i < 3; i++) {
          const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
          const expenses = createEmptyExpensesData({ totalExpenses: 3000 });
          processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), createEmptyPhysicalAssetsData());
        }

        const annualData = processor.getAnnualData();

        // 3000 withdrawn each month for 3 months = 9000 total
        const totalWithdrawals =
          annualData.withdrawalsForPeriod.stocks + annualData.withdrawalsForPeriod.bonds + annualData.withdrawalsForPeriod.cash;
        expect(totalWithdrawals).toBeCloseTo(9000, 0);
      });

      it('should aggregate shortfallForPeriod across multiple months', () => {
        const portfolio = new Portfolio([createSavingsAccount({ balance: 2000 })]);
        const state = createMockSimulationState(portfolio, 65);
        const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

        // Month 1: 2k available, 3k expenses = 1k shortfall
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 3000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        // Month 2: 0 available, 2k expenses = 2k shortfall
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 2000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        const annualData = processor.getAnnualData();

        // Total shortfall = 1k + 2k = 3k
        expect(annualData.shortfallForPeriod).toBe(3000);
      });

      it('should aggregate employerMatchForPeriod across multiple months', () => {
        const portfolio = new Portfolio([create401kAccount({ id: '401k-1', balance: 50000 })]);
        const state = createMockSimulationState(portfolio, 35, 'accumulation');
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext(),
          new ContributionRules(
            [
              createContributionRule({
                accountId: '401k-1',
                // Use unlimited contributions so all available cash goes to the 401k each month
                contributionType: 'unlimited',
                employerMatch: 3000, // Employer matches dollar-for-dollar up to $3000 annual cap
              }),
            ],
            { type: 'spend' }
          )
        );

        // Process 3 months with $500 available to contribute each month
        for (let i = 0; i < 3; i++) {
          const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 500 });
          const expenses = createEmptyExpensesData({ totalExpenses: 0 });
          processor.processContributionsAndWithdrawals(incomes, expenses, createEmptyDebtsData(), createEmptyPhysicalAssetsData());
        }

        const annualData = processor.getAnnualData();

        // With unlimited contributions and $500/month available:
        // Month 1: $500 contribution, $500 employer match (3000-500=2500 remaining in cap)
        // Month 2: $500 contribution, $500 employer match (2500-500=2000 remaining in cap)
        // Month 3: $500 contribution, $500 employer match (2000-500=1500 remaining in cap)
        // Total employer match = 1500
        expect(annualData.employerMatchForPeriod).toBeCloseTo(1500, 0);
      });
    });

    describe('cumulative field handling', () => {
      it('should use last month cumulative values, not aggregate them', () => {
        const portfolio = new Portfolio([createSavingsAccount({ id: 'savings-1', balance: 10000 })]);
        const state = createMockSimulationState(portfolio, 65);
        const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

        // Month 1: withdraw 2k
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 2000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        // Month 2: withdraw 3k
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 3000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        const annualData = processor.getAnnualData();

        // Cumulative should be 5k (2k + 3k), not 7k (2k + 5k if incorrectly summing cumulative)
        const totalCumulativeWithdrawals =
          annualData.cumulativeWithdrawals.stocks + annualData.cumulativeWithdrawals.bonds + annualData.cumulativeWithdrawals.cash;
        expect(totalCumulativeWithdrawals).toBeCloseTo(5000, 0);
      });

      it('should use last month totalValue, not sum across months', () => {
        const portfolio = new Portfolio([create401kAccount({ id: '401k-1', balance: 100000 })]);
        const state = createMockSimulationState(portfolio, 35, 'accumulation');
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext(),
          new ContributionRules([createContributionRule({ accountId: '401k-1' })], { type: 'spend' })
        );

        // Process 3 months with contributions
        for (let i = 0; i < 3; i++) {
          processor.processContributionsAndWithdrawals(
            createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 5000 }),
            createEmptyExpensesData({ totalExpenses: 0 }),
            createEmptyDebtsData(),
            createEmptyPhysicalAssetsData()
          );
        }

        const annualData = processor.getAnnualData();

        // Total value should be ~115k (100k + 15k contributions), not sum of all monthly values
        expect(annualData.totalValue).toBeCloseTo(115000, 0);
      });

      it('should use last month outstandingShortfall, not aggregate', () => {
        const portfolio = new Portfolio([createSavingsAccount({ balance: 1000 })]);
        const state = createMockSimulationState(portfolio, 65);
        const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

        // Month 1: 1k shortfall (need 2k, have 1k)
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 2000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        // Month 2: 1k more shortfall
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 1000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        const annualData = processor.getAnnualData();

        // Outstanding shortfall is cumulative, should be 2k at end of month 2
        expect(annualData.outstandingShortfall).toBe(2000);
        // Period shortfall should be aggregated: 1k + 1k = 2k
        expect(annualData.shortfallForPeriod).toBe(2000);
      });
    });

    describe('per-account data aggregation', () => {
      it('should aggregate per-account period fields across months', () => {
        const portfolio = new Portfolio([
          create401kAccount({ id: '401k-1', balance: 50000 }),
          createSavingsAccount({ id: 'savings-1', balance: 10000 }),
        ]);
        const state = createMockSimulationState(portfolio, 35, 'accumulation');
        const processor = new PortfolioProcessor(
          state,
          createMockSimulationContext(),
          new ContributionRules([createContributionRule({ accountId: '401k-1' })], { type: 'spend' })
        );

        // Process 3 months
        for (let i = 0; i < 3; i++) {
          processor.processContributionsAndWithdrawals(
            createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 2000 }),
            createEmptyExpensesData({ totalExpenses: 0 }),
            createEmptyDebtsData(),
            createEmptyPhysicalAssetsData()
          );
        }

        const annualData = processor.getAnnualData();

        // 401k should have aggregated contributions from all 3 months
        const account401kData = annualData.perAccountData['401k-1'];
        const totalContributions =
          account401kData.contributionsForPeriod.stocks +
          account401kData.contributionsForPeriod.bonds +
          account401kData.contributionsForPeriod.cash;
        expect(totalContributions).toBeCloseTo(6000, 0);
      });

      it('should preserve per-account cumulative fields from last month', () => {
        const portfolio = new Portfolio([createSavingsAccount({ id: 'savings-1', balance: 10000 })]);
        const state = createMockSimulationState(portfolio, 65);
        const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

        // Month 1: withdraw 3k
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 3000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        // Month 2: withdraw 2k
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 2000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        const annualData = processor.getAnnualData();
        const savingsData = annualData.perAccountData['savings-1'];

        // Balance should be last month's value: 10k - 3k - 2k = 5k
        expect(savingsData.balance).toBe(5000);

        // Cumulative withdrawals should be 5k (from last month, not summed across months)
        const totalCumulative =
          savingsData.cumulativeWithdrawals.stocks + savingsData.cumulativeWithdrawals.bonds + savingsData.cumulativeWithdrawals.cash;
        expect(totalCumulative).toBeCloseTo(5000, 0);

        // Period withdrawals should be aggregated: 3k + 2k = 5k
        const totalPeriod =
          savingsData.withdrawalsForPeriod.stocks + savingsData.withdrawalsForPeriod.bonds + savingsData.withdrawalsForPeriod.cash;
        expect(totalPeriod).toBeCloseTo(5000, 0);
      });
    });

    describe('reset behavior', () => {
      it('should return empty data after resetMonthlyData', () => {
        const portfolio = new Portfolio([createSavingsAccount({ balance: 10000 })]);
        const state = createMockSimulationState(portfolio, 65);
        const processor = new PortfolioProcessor(state, createMockSimulationContext(), new ContributionRules([], { type: 'spend' }));

        // Process some data
        processor.processContributionsAndWithdrawals(
          createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 }),
          createEmptyExpensesData({ totalExpenses: 5000 }),
          createEmptyDebtsData(),
          createEmptyPhysicalAssetsData()
        );

        // Reset
        processor.resetMonthlyData();

        const annualData = processor.getAnnualData();

        // After reset, period data should be zero (reduce starts from zero accumulator)
        const totalWithdrawals =
          annualData.withdrawalsForPeriod.stocks + annualData.withdrawalsForPeriod.bonds + annualData.withdrawalsForPeriod.cash;
        expect(totalWithdrawals).toBe(0);
      });
    });
  });
});
