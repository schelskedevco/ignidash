import { describe, it, expect } from 'vitest';

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { IncomeInputs } from '@/lib/schemas/inputs/income-form-schema';
import type { ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';
import type { ContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import type { TimelineInputs } from '@/lib/schemas/inputs/timeline-form-schema';
import type { MarketAssumptionsInputs } from '@/lib/schemas/inputs/market-assumptions-schema';

import {
  FinancialSimulationEngine,
  MonteCarloSimulationEngine,
  LcgHistoricalBacktestSimulationEngine,
  type SimulationState,
} from './simulation-engine';
import { FixedReturnsProvider } from './returns-providers/fixed-returns-provider';
import { Portfolio } from './portfolio';
import { Incomes, IncomesProcessor } from './incomes';
import { Expenses, ExpensesProcessor } from './expenses';
import { PhaseIdentifier } from './phase';
import { SeededRandom } from './returns-providers/seeded-random';

// ============================================================================
// Test Fixtures
// ============================================================================

const createDefaultMarketAssumptions = (): MarketAssumptionsInputs => ({
  stockReturn: 9,
  stockYield: 2,
  bondReturn: 4,
  bondYield: 3.5,
  cashReturn: 3,
  inflationRate: 3,
});

const createDefaultTimeline = (): TimelineInputs => ({
  lifeExpectancy: 87,
  birthMonth: 1,
  birthYear: 1990,
  retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
});

// Account factories
const createSavingsAccount = (overrides?: { id?: string; name?: string; balance?: number }): AccountInputs & { type: 'savings' } => ({
  type: 'savings',
  id: overrides?.id ?? 'savings-1',
  name: overrides?.name ?? 'Savings Account',
  balance: overrides?.balance ?? 10000,
});

const create401kAccount = (overrides?: {
  id?: string;
  name?: string;
  balance?: number;
  percentBonds?: number;
}): AccountInputs & { type: '401k' } => ({
  type: '401k',
  id: overrides?.id ?? '401k-1',
  name: overrides?.name ?? '401k Account',
  balance: overrides?.balance ?? 100000,
  percentBonds: overrides?.percentBonds ?? 20,
});

const createRothIraAccount = (overrides?: {
  id?: string;
  name?: string;
  balance?: number;
  percentBonds?: number;
  contributionBasis?: number;
}): AccountInputs & { type: 'rothIra' } => ({
  type: 'rothIra',
  id: overrides?.id ?? 'roth-1',
  name: overrides?.name ?? 'Roth IRA',
  balance: overrides?.balance ?? 50000,
  percentBonds: overrides?.percentBonds ?? 10,
  contributionBasis: overrides?.contributionBasis ?? 40000,
});

// Income factory
const createWageIncome = (overrides?: {
  id?: string;
  name?: string;
  amount?: number;
  frequency?: IncomeInputs['frequency'];
  timeframe?: IncomeInputs['timeframe'];
  taxes?: IncomeInputs['taxes'];
  growth?: IncomeInputs['growth'];
  disabled?: boolean;
}): IncomeInputs => ({
  id: overrides?.id ?? 'income-1',
  name: overrides?.name ?? 'Salary',
  amount: overrides?.amount ?? 100000,
  frequency: overrides?.frequency ?? 'yearly',
  timeframe: overrides?.timeframe ?? {
    start: { type: 'now' },
    end: { type: 'atRetirement' },
  },
  taxes: overrides?.taxes ?? { incomeType: 'wage', withholding: 22 },
  growth: overrides?.growth,
  disabled: overrides?.disabled ?? false,
});

// Expense factory
const createLivingExpense = (overrides?: {
  id?: string;
  name?: string;
  amount?: number;
  frequency?: ExpenseInputs['frequency'];
  timeframe?: ExpenseInputs['timeframe'];
  growth?: ExpenseInputs['growth'];
  disabled?: boolean;
}): ExpenseInputs => ({
  id: overrides?.id ?? 'expense-1',
  name: overrides?.name ?? 'Living Expenses',
  amount: overrides?.amount ?? 40000,
  frequency: overrides?.frequency ?? 'yearly',
  timeframe: overrides?.timeframe ?? {
    start: { type: 'now' },
    end: { type: 'atLifeExpectancy' },
  },
  growth: overrides?.growth,
  disabled: overrides?.disabled ?? false,
});

// Contribution rule factory
const createContributionRule = (overrides?: {
  id?: string;
  accountId?: string;
  rank?: number;
  disabled?: boolean;
  employerMatch?: number;
}): ContributionInputs => ({
  id: overrides?.id ?? 'contribution-1',
  accountId: overrides?.accountId ?? '401k-1',
  rank: overrides?.rank ?? 1,
  contributionType: 'unlimited',
  disabled: overrides?.disabled ?? false,
  employerMatch: overrides?.employerMatch,
});

// Simulator inputs factory
const createSimulatorInputs = (overrides?: Partial<SimulatorInputs>): SimulatorInputs => ({
  timeline: overrides?.timeline !== undefined ? overrides.timeline : createDefaultTimeline(),
  incomes: overrides?.incomes ?? {},
  expenses: overrides?.expenses ?? {},
  debts: overrides?.debts ?? {},
  physicalAssets: overrides?.physicalAssets ?? {},
  accounts: overrides?.accounts ?? {},
  contributionRules: overrides?.contributionRules ?? {},
  baseContributionRule: overrides?.baseContributionRule ?? { type: 'save' },
  marketAssumptions: overrides?.marketAssumptions ?? createDefaultMarketAssumptions(),
  taxSettings: overrides?.taxSettings ?? { filingStatus: 'single' },
  privacySettings: overrides?.privacySettings ?? { isPrivate: true },
  simulationSettings: overrides?.simulationSettings ?? { simulationSeed: 12345, simulationMode: 'fixedReturns' },
  glidePath: overrides?.glidePath,
});

// ============================================================================
// SeededRandom Tests
// ============================================================================

describe('SeededRandom', () => {
  describe('deterministic behavior', () => {
    it('should produce identical sequences with the same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      for (let i = 0; i < 100; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(43);
      const seq1 = Array.from({ length: 10 }, () => rng1.next());
      const seq2 = Array.from({ length: 10 }, () => rng2.next());
      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('value range', () => {
    it('should produce values in [0, 1)', () => {
      const rng = new SeededRandom(12345);
      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('nextGaussian', () => {
    it('should produce approximately normal distribution', () => {
      const rng = new SeededRandom(54321);
      const samples = Array.from({ length: 10000 }, () => rng.nextGaussian());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, x) => sum + (x - mean) ** 2, 0) / samples.length;
      expect(mean).toBeCloseTo(0, 1);
      expect(Math.sqrt(variance)).toBeCloseTo(1, 1);
    });
  });

  describe('reset', () => {
    it('should reproduce the same sequence after reset', () => {
      const rng = new SeededRandom(42);
      const seq1 = Array.from({ length: 10 }, () => rng.next());
      rng.reset(42);
      const seq2 = Array.from({ length: 10 }, () => rng.next());
      expect(seq1).toEqual(seq2);
    });
  });

  describe('edge cases', () => {
    it('should handle seed of 0', () => {
      const rng = new SeededRandom(0);
      expect(rng.next()).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative seeds', () => {
      const rng = new SeededRandom(-100);
      expect(rng.next()).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// Portfolio Tests
// ============================================================================

describe('Portfolio', () => {
  describe('initialization', () => {
    it('should create accounts from input data', () => {
      const portfolio = new Portfolio([createSavingsAccount(), create401kAccount(), createRothIraAccount()]);
      expect(portfolio.getAccounts().length).toBe(3);
      expect(portfolio.getTotalValue()).toBe(160000);
    });

    it('should calculate weighted asset allocation', () => {
      const portfolio = new Portfolio([create401kAccount({ balance: 100000, percentBonds: 20 })]);
      const allocation = portfolio.getWeightedAssetAllocation();
      expect(allocation?.stocks).toBeCloseTo(0.8);
      expect(allocation?.bonds).toBeCloseTo(0.2);
    });

    it('should return null allocation for empty portfolio', () => {
      const emptyPortfolio = new Portfolio([]);
      expect(emptyPortfolio.getWeightedAssetAllocation()).toBeNull();
    });
  });

  describe('applyReturns', () => {
    it('should apply returns to all accounts', () => {
      const portfolio = new Portfolio([createSavingsAccount({ balance: 10000 }), create401kAccount({ balance: 90000, percentBonds: 0 })]);
      const { returnsForPeriod } = portfolio.applyReturns({ stocks: 0.1, bonds: 0.05, cash: 0.02 });
      expect(returnsForPeriod.cash).toBe(200);
      expect(returnsForPeriod.stocks).toBe(9000);
      expect(portfolio.getTotalValue()).toBe(109200);
    });
  });

  describe('getAccountById', () => {
    it('should find account by ID', () => {
      const portfolio = new Portfolio([createSavingsAccount({ id: 'test-id-123' })]);
      const account = portfolio.getAccountById('test-id-123');
      expect(account?.getAccountID()).toBe('test-id-123');
    });

    it('should return undefined for non-existent ID', () => {
      const portfolio = new Portfolio([createSavingsAccount()]);
      expect(portfolio.getAccountById('non-existent')).toBeUndefined();
    });
  });
});

// ============================================================================
// Incomes Tests
// ============================================================================

describe('Incomes', () => {
  const createMockState = (age: number, phase: 'accumulation' | 'retirement' = 'accumulation'): SimulationState => ({
    time: { date: new Date(), age, year: age - 30, month: (age - 30) * 12 },
    portfolio: new Portfolio([]),
    phase: { name: phase },
    annualData: { expenses: [] },
  });

  describe('wage income processing', () => {
    it('should calculate monthly wage income correctly', () => {
      const incomes = new Incomes([createWageIncome({ amount: 120000, frequency: 'yearly' })]);
      const processor = new IncomesProcessor(createMockState(35), incomes);
      expect(processor.process().totalIncome).toBe(10000);
    });

    it('should calculate withholding and FICA taxes', () => {
      const incomes = new Incomes([createWageIncome({ amount: 120000, taxes: { incomeType: 'wage', withholding: 22 } })]);
      const processor = new IncomesProcessor(createMockState(35), incomes);
      const result = processor.process();
      expect(result.totalAmountWithheld).toBe(2200);
      expect(result.totalFicaTax).toBe(765);
    });
  });

  describe('income timeframes', () => {
    it('should only include income within active timeframe', () => {
      const incomes = new Incomes([
        createWageIncome({ timeframe: { start: { type: 'customAge', age: 30 }, end: { type: 'customAge', age: 40 } } }),
      ]);
      expect(incomes.getActiveIncomesByTimeFrame(createMockState(35)).length).toBe(1);
      expect(incomes.getActiveIncomesByTimeFrame(createMockState(45)).length).toBe(0);
    });

    it('should handle retirement-based timeframes', () => {
      const incomes = new Incomes([createWageIncome({ timeframe: { start: { type: 'now' }, end: { type: 'atRetirement' } } })]);
      expect(incomes.getActiveIncomesByTimeFrame(createMockState(35, 'accumulation')).length).toBe(1);
      expect(incomes.getActiveIncomesByTimeFrame(createMockState(65, 'retirement')).length).toBe(0);
    });
  });

  describe('disabled incomes', () => {
    it('should not include disabled incomes', () => {
      const incomes = new Incomes([createWageIncome({ disabled: true }), createWageIncome({ id: 'income-2', disabled: false })]);
      expect(incomes.getActiveIncomesByTimeFrame(createMockState(35)).length).toBe(1);
    });
  });
});

// ============================================================================
// Expenses Tests
// ============================================================================

describe('Expenses', () => {
  const createMockState = (age: number, phase: 'accumulation' | 'retirement' = 'accumulation'): SimulationState => ({
    time: { date: new Date(), age, year: age - 30, month: (age - 30) * 12 },
    portfolio: new Portfolio([]),
    phase: { name: phase },
    annualData: { expenses: [] },
  });

  describe('expense processing', () => {
    it('should calculate monthly expenses correctly', () => {
      const expenses = new Expenses([createLivingExpense({ amount: 48000, frequency: 'yearly' })]);
      const processor = new ExpensesProcessor(createMockState(35), expenses);
      expect(processor.process().totalExpenses).toBe(4000);
    });

    it('should handle monthly frequency', () => {
      const expenses = new Expenses([createLivingExpense({ amount: 1000, frequency: 'monthly' })]);
      const processor = new ExpensesProcessor(createMockState(35), expenses);
      expect(processor.process().totalExpenses).toBe(1000);
    });

    it('should handle one-time expenses', () => {
      const expenses = new Expenses([createLivingExpense({ amount: 5000, frequency: 'oneTime', timeframe: { start: { type: 'now' } } })]);
      const processor = new ExpensesProcessor(createMockState(35), expenses);
      expect(processor.process().totalExpenses).toBe(5000);
      expect(processor.process().totalExpenses).toBe(0);
    });
  });

  describe('discretionary expenses', () => {
    it('should add discretionary expenses to current month data', () => {
      const expenses = new Expenses([createLivingExpense({ amount: 1000, frequency: 'monthly' })]);
      const processor = new ExpensesProcessor(createMockState(35), expenses);
      processor.process();
      processor.processDiscretionaryExpense(500);
      expect(processor.getAnnualData().totalExpenses).toBe(1500);
    });
  });
});

// ============================================================================
// Phase Identifier Tests
// ============================================================================

describe('PhaseIdentifier', () => {
  const createMockState = (age: number, phase: 'accumulation' | 'retirement' | null = null): SimulationState => ({
    time: { date: new Date(), age, year: age - 30, month: (age - 30) * 12 },
    portfolio: new Portfolio([create401kAccount({ balance: 1000000 })]),
    phase: phase ? { name: phase } : null,
    annualData: { expenses: [] },
  });

  describe('fixed age retirement strategy', () => {
    it('should return accumulation before retirement age', () => {
      const identifier = new PhaseIdentifier(createMockState(50), {
        ...createDefaultTimeline(),
        retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
      });
      expect(identifier.getCurrentPhase().name).toBe('accumulation');
    });

    it('should return retirement at or after retirement age', () => {
      const identifier = new PhaseIdentifier(createMockState(65), {
        ...createDefaultTimeline(),
        retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
      });
      expect(identifier.getCurrentPhase().name).toBe('retirement');
    });
  });

  describe('SWR target retirement strategy', () => {
    it('should return accumulation when SWR target not met', () => {
      const state = createMockState(50);
      state.annualData.expenses = [{ totalExpenses: 50000, perExpenseData: {} }];
      const identifier = new PhaseIdentifier(state, {
        ...createDefaultTimeline(),
        retirementStrategy: { type: 'swrTarget', safeWithdrawalRate: 4 },
      });
      expect(identifier.getCurrentPhase().name).toBe('accumulation');
    });

    it('should return retirement when SWR target is met', () => {
      const state = createMockState(50);
      state.annualData.expenses = [{ totalExpenses: 30000, perExpenseData: {} }];
      const identifier = new PhaseIdentifier(state, {
        ...createDefaultTimeline(),
        retirementStrategy: { type: 'swrTarget', safeWithdrawalRate: 4 },
      });
      expect(identifier.getCurrentPhase().name).toBe('retirement');
    });

    it('should stay in retirement once entered', () => {
      const identifier = new PhaseIdentifier(createMockState(50, 'retirement'), {
        ...createDefaultTimeline(),
        retirementStrategy: { type: 'swrTarget', safeWithdrawalRate: 4 },
      });
      expect(identifier.getCurrentPhase().name).toBe('retirement');
    });
  });
});

// ============================================================================
// FixedReturnsProvider Tests
// ============================================================================

describe('FixedReturnsProvider', () => {
  it('should calculate real returns from nominal returns and inflation', () => {
    const inputs = createSimulatorInputs({
      marketAssumptions: { stockReturn: 10, bondReturn: 5, cashReturn: 3, inflationRate: 3, stockYield: 2, bondYield: 3.5 },
    });
    const provider = new FixedReturnsProvider(inputs);
    const { returns, inflationRate } = provider.getReturns(null);
    expect(returns.stocks).toBeCloseTo(1.1 / 1.03 - 1, 6);
    expect(returns.bonds).toBeCloseTo(1.05 / 1.03 - 1, 6);
    expect(returns.cash).toBeCloseTo(0, 6);
    expect(inflationRate).toBe(3);
  });

  it('should return consistent values regardless of phase', () => {
    const provider = new FixedReturnsProvider(createSimulatorInputs());
    const r1 = provider.getReturns({ name: 'accumulation' });
    const r2 = provider.getReturns({ name: 'retirement' });
    expect(r1.returns).toEqual(r2.returns);
  });
});

// ============================================================================
// Simulation Engine Integration Tests
// ============================================================================

describe('FinancialSimulationEngine', () => {
  describe('basic simulation', () => {
    it('should run a complete simulation', () => {
      const inputs = createSimulatorInputs({
        timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 95 },
        accounts: { 'account-1': create401kAccount({ id: 'account-1', balance: 100000 }) },
        incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 80000 }) },
        expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 40000 }) },
        contributionRules: { 'rule-1': createContributionRule({ id: 'rule-1', accountId: 'account-1' }) },
      });
      const engine = new FinancialSimulationEngine(inputs);
      const result = engine.runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.context.endAge).toBe(95);
    });

    it('should track portfolio value over time', () => {
      const inputs = createSimulatorInputs({
        timeline: createDefaultTimeline(),
        accounts: { 'account-1': create401kAccount({ id: 'account-1', balance: 100000 }) },
      });
      const engine = new FinancialSimulationEngine(inputs);
      const result = engine.runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);
      expect(result.data[0].portfolio.totalValue).toBe(100000);
      expect(result.data[result.data.length - 1].portfolio.totalValue).toBeGreaterThan(0);
    });
  });

  describe('retirement phase transition', () => {
    it('should transition to retirement phase at retirement age', () => {
      const inputs = createSimulatorInputs({
        timeline: { ...createDefaultTimeline(), retirementStrategy: { type: 'fixedAge', retirementAge: 65 } },
        accounts: { 'account-1': create401kAccount({ id: 'account-1' }) },
        incomes: { 'income-1': createWageIncome({ id: 'income-1', timeframe: { start: { type: 'now' }, end: { type: 'atRetirement' } } }) },
      });
      const result = new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);
      const before = result.data.find((d) => Math.floor(d.age) === 64);
      const after = result.data.find((d) => Math.floor(d.age) === 66);
      expect(before?.phase?.name).toBe('accumulation');
      expect(after?.phase?.name).toBe('retirement');
    });
  });

  describe('RMD processing', () => {
    it('should calculate RMD age based on birth year', () => {
      const inputs1960 = createSimulatorInputs({ timeline: { ...createDefaultTimeline(), birthYear: 1960 } });
      const result1960 = new FinancialSimulationEngine(inputs1960).runSimulation(
        new FixedReturnsProvider(inputs1960),
        inputs1960.timeline!
      );
      expect(result1960.context.rmdAge).toBe(75);

      const inputs1959 = createSimulatorInputs({ timeline: { ...createDefaultTimeline(), birthYear: 1959 } });
      const result1959 = new FinancialSimulationEngine(inputs1959).runSimulation(
        new FixedReturnsProvider(inputs1959),
        inputs1959.timeline!
      );
      expect(result1959.context.rmdAge).toBe(73);
    });
  });
});

// ============================================================================
// Monte Carlo Simulation Tests
// ============================================================================

describe('MonteCarloSimulationEngine', () => {
  it('should run multiple simulations with different seeds', () => {
    const inputs = createSimulatorInputs({
      timeline: createDefaultTimeline(),
      accounts: { 'account-1': create401kAccount({ id: 'account-1', balance: 500000 }) },
    });
    const result = new MonteCarloSimulationEngine(inputs, 12345).runMonteCarloSimulation(3);
    expect(result.simulations.length).toBe(3);
    expect(new Set(result.simulations.map(([seed]) => seed)).size).toBe(3);
  });

  it('should produce deterministic results with same base seed', () => {
    const inputs = createSimulatorInputs({
      timeline: createDefaultTimeline(),
      accounts: { 'account-1': create401kAccount({ id: 'account-1', balance: 100000 }) },
    });
    const r1 = new MonteCarloSimulationEngine(inputs, 99999).runSingleSimulation(99999);
    const r2 = new MonteCarloSimulationEngine(inputs, 99999).runSingleSimulation(99999);
    expect(r1.data[r1.data.length - 1].portfolio.totalValue).toBe(r2.data[r2.data.length - 1].portfolio.totalValue);
  });

  it('should call progress callback', () => {
    const inputs = createSimulatorInputs({
      timeline: createDefaultTimeline(),
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1' }) },
    });
    let count = 0;
    new MonteCarloSimulationEngine(inputs, 12345).runMonteCarloSimulation(5, () => count++);
    expect(count).toBe(5);
  });
});

// ============================================================================
// Historical Backtest Tests
// ============================================================================

describe('LcgHistoricalBacktestSimulationEngine', () => {
  it('should run historical backtests', () => {
    const inputs = createSimulatorInputs({
      timeline: createDefaultTimeline(),
      accounts: { 'account-1': create401kAccount({ id: 'account-1', balance: 500000 }) },
    });
    const result = new LcgHistoricalBacktestSimulationEngine(inputs, 42).runLcgHistoricalBacktest(3);
    expect(result.simulations.length).toBe(3);
    for (const [, sim] of result.simulations) {
      expect(sim.context.historicalRanges).toBeDefined();
      expect(sim.context.historicalRanges!.length).toBeGreaterThan(0);
    }
  });

  it('should allow start year override', () => {
    const inputs = createSimulatorInputs({
      timeline: createDefaultTimeline(),
      accounts: { 'account-1': create401kAccount({ id: 'account-1', balance: 100000 }) },
    });
    const result = new LcgHistoricalBacktestSimulationEngine(inputs, 42).runSingleSimulation(42, 1929, undefined);
    expect(result.context.historicalRanges![0].startYear).toBe(1929);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle simulation with no accounts', () => {
    const inputs = createSimulatorInputs({ timeline: createDefaultTimeline(), accounts: {} });
    const result = new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);
    expect(result.data[0].portfolio.totalValue).toBe(0);
  });

  it('should handle simulation with no income or expenses', () => {
    const inputs = createSimulatorInputs({
      timeline: createDefaultTimeline(),
      accounts: { 'account-1': create401kAccount({ id: 'account-1', balance: 100000 }) },
      incomes: {},
      expenses: {},
    });
    expect(() => new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!)).not.toThrow();
  });

  it('should handle zero balance accounts', () => {
    const inputs = createSimulatorInputs({
      timeline: createDefaultTimeline(),
      accounts: { 'account-1': create401kAccount({ id: 'account-1', balance: 0 }) },
    });
    expect(() => new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!)).not.toThrow();
  });
});

// ============================================================================
// Debts Integration Tests
// ============================================================================

describe('Debts Integration', () => {
  it('should deduct debt payments from surplus before contributions', () => {
    // Without debt: all surplus goes to contributions
    const inputsWithoutDebt = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 92 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 10000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 60000 }) }, // $5000/month
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 24000 }) }, // $2000/month
      debts: {},
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const resultWithoutDebt = new FinancialSimulationEngine(inputsWithoutDebt).runSimulation(
      new FixedReturnsProvider(inputsWithoutDebt),
      inputsWithoutDebt.timeline!
    );

    // With debt: debt payments reduce surplus available for contributions
    const inputsWithDebt = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 92 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 10000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 60000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 24000 }) },
      debts: {
        'debt-1': {
          id: 'debt-1',
          name: 'Credit Card',
          balance: 10000,
          apr: 18,
          interestType: 'simple' as const,
          startDate: { type: 'now' as const },
          monthlyPayment: 500, // $500/month debt payment
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const resultWithDebt = new FinancialSimulationEngine(inputsWithDebt).runSimulation(
      new FixedReturnsProvider(inputsWithDebt),
      inputsWithDebt.timeline!
    );

    // After year 1, debt payments should reduce portfolio value
    const portfolioYear1WithoutDebt = resultWithoutDebt.data[1].portfolio.totalValue;
    const portfolioYear1WithDebt = resultWithDebt.data[1].portfolio.totalValue;

    // Debt payments ($500/month * 12 = $6000/year) reduce contributions
    expect(portfolioYear1WithDebt).toBeLessThan(portfolioYear1WithoutDebt);

    // Verify debt data is tracked
    expect(resultWithDebt.data[1].debts).not.toBeNull();
    expect(resultWithDebt.data[1].debts!.totalPayment).toBeGreaterThan(0);
  });

  it('should stop payments after debt is paid off', () => {
    const inputs = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 95 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 50000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 120000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 36000 }) },
      debts: {
        'debt-1': {
          id: 'debt-1',
          name: 'Car Loan',
          balance: 6000, // Small loan that will pay off in year 1
          apr: 5,
          interestType: 'simple' as const,
          startDate: { type: 'now' as const },
          monthlyPayment: 600, // Will pay off in ~10 months
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const result = new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);

    // Year 1: Debt should have payments and be paid off by end of year
    expect(result.data[1].debts!.totalPayment).toBeGreaterThan(0);
    expect(result.data[1].debts!.perDebtData['debt-1'].balance).toBe(0);

    // Year 2: Debt is paid off, no more payments
    expect(result.data[2].debts!.totalPayment).toBe(0);
  });

  it('should respect debt start date timepoints', () => {
    const inputs = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 95 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 50000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 120000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 36000 }) },
      debts: {
        'debt-1': {
          id: 'debt-1',
          name: 'Future Debt',
          balance: 20000,
          apr: 8,
          interestType: 'simple' as const,
          startDate: { type: 'customAge' as const, age: 40 }, // Starts at age 40
          monthlyPayment: 500,
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const result = new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);

    // Find year before and after age 40
    const yearBefore40 = result.data.find((d) => Math.floor(d.age) === 39);
    const yearAfter40 = result.data.find((d) => Math.floor(d.age) === 41);

    // Before age 40: No debt payments
    expect(yearBefore40?.debts?.totalPayment ?? 0).toBe(0);

    // After age 40: Debt payments should be happening
    expect(yearAfter40?.debts?.totalPayment).toBeGreaterThan(0);
  });
});

// ============================================================================
// Physical Assets Integration Tests
// ============================================================================

describe('Physical Assets Integration', () => {
  it('should add sale proceeds to available surplus', () => {
    // Without asset sale
    const inputsWithoutSale = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 50 }, // Shorter timeline
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 50000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 100000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 60000 }) },
      physicalAssets: {},
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const resultWithoutSale = new FinancialSimulationEngine(inputsWithoutSale).runSimulation(
      new FixedReturnsProvider(inputsWithoutSale),
      inputsWithoutSale.timeline!
    );

    // With asset sale at age 40
    const inputsWithSale = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 50 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 50000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 100000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 60000 }) },
      physicalAssets: {
        'asset-1': {
          id: 'asset-1',
          name: 'Rental Property',
          purchaseDate: { type: 'now' as const },
          purchasePrice: 100000,
          appreciationRate: 0, // No appreciation for predictable test
          saleDate: { type: 'customAge' as const, age: 40 },
          paymentMethod: { type: 'cash' },
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const resultWithSale = new FinancialSimulationEngine(inputsWithSale).runSimulation(
      new FixedReturnsProvider(inputsWithSale),
      inputsWithSale.timeline!
    );

    // Find the year when the sale occurs by checking physicalAssets data
    const saleYearData = resultWithSale.data.find((d) => (d.physicalAssets?.totalSaleProceeds ?? 0) > 0);

    // Verify sale proceeds are tracked
    expect(saleYearData).toBeDefined();
    expect(saleYearData!.physicalAssets!.totalSaleProceeds).toBe(100000);

    // At the sale year, the portfolio with sale should have gained the sale proceeds
    const saleYearIndex = resultWithSale.data.indexOf(saleYearData!);
    const portfolioWithSaleAtSale = resultWithSale.data[saleYearIndex].portfolio.totalValue;
    const portfolioWithoutSaleAtSale = resultWithoutSale.data[saleYearIndex].portfolio.totalValue;

    // Sale proceeds should have added to the portfolio
    expect(portfolioWithSaleAtSale - portfolioWithoutSaleAtSale).toBeGreaterThan(90000); // ~$100k difference minus taxes
  });

  it('should deduct purchase down payment from surplus', () => {
    // Without asset purchase
    const inputsWithoutPurchase = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 50 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 100000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 120000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 60000 }) },
      physicalAssets: {},
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const resultWithoutPurchase = new FinancialSimulationEngine(inputsWithoutPurchase).runSimulation(
      new FixedReturnsProvider(inputsWithoutPurchase),
      inputsWithoutPurchase.timeline!
    );

    // With asset purchase at age 40 (clear future date)
    const inputsWithPurchase = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 50 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 100000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 120000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 60000 }) },
      physicalAssets: {
        'asset-1': {
          id: 'asset-1',
          name: 'Investment Property',
          purchaseDate: { type: 'customAge' as const, age: 40 },
          purchasePrice: 300000,
          appreciationRate: 0,
          saleDate: { type: 'atLifeExpectancy' as const },
          paymentMethod: {
            type: 'loan',
            downPayment: 60000, // 20% down
            loanBalance: 240000,
            apr: 6,
            monthlyPayment: 1438.92, // Standard 30yr payment at 6% APR on $240k
          },
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const resultWithPurchase = new FinancialSimulationEngine(inputsWithPurchase).runSimulation(
      new FixedReturnsProvider(inputsWithPurchase),
      inputsWithPurchase.timeline!
    );

    // Find the year when purchase happens by checking physicalAssets data
    const purchaseYearData = resultWithPurchase.data.find((d) => (d.physicalAssets?.totalPurchaseOutlay ?? 0) > 0);

    // Verify purchase expense is tracked
    expect(purchaseYearData).toBeDefined();
    expect(purchaseYearData!.physicalAssets!.totalPurchaseOutlay).toBe(60000);

    // After purchase, portfolio with down payment should have less liquid assets
    const yearAfterPurchase = resultWithPurchase.data.findIndex((d) => (d.physicalAssets?.totalPurchaseOutlay ?? 0) > 0);
    if (yearAfterPurchase >= 0 && yearAfterPurchase < resultWithoutPurchase.data.length) {
      const portfolioWithPurchase = resultWithPurchase.data[yearAfterPurchase].portfolio.totalValue;
      const portfolioWithoutPurchase = resultWithoutPurchase.data[yearAfterPurchase].portfolio.totalValue;
      expect(portfolioWithPurchase).toBeLessThan(portfolioWithoutPurchase);
    }
  });

  it('should include capital gains from physical assets in tax calculation', () => {
    const inputs = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 50 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 50000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 100000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 50000 }) },
      physicalAssets: {
        'asset-1': {
          id: 'asset-1',
          name: 'Appreciated Property',
          purchaseDate: { type: 'now' as const },
          purchasePrice: 200000, // Cost basis
          marketValue: 350000, // Current value (already appreciated)
          appreciationRate: 0,
          saleDate: { type: 'customAge' as const, age: 40 }, // Sell at age 40
          paymentMethod: { type: 'cash' },
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const result = new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);

    // Find year when sale occurs by checking physicalAssets data
    const saleYearData = result.data.find((d) => (d.physicalAssets?.totalSaleProceeds ?? 0) > 0);

    // Verify capital gain is tracked
    expect(saleYearData).toBeDefined();
    expect(saleYearData!.physicalAssets!.totalCapitalGain).toBeCloseTo(150000, 0); // 350000 - 200000

    // Verify taxes include the capital gain (uses incomeSources, not incomeBreakdown)
    expect(saleYearData!.taxes).not.toBeNull();
    expect(saleYearData!.taxes!.incomeSources.realizedGains).toBeGreaterThan(0);
  });

  it('should track asset equity in simulation data', () => {
    const inputs = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 50 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 50000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 150000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 60000 }) },
      physicalAssets: {
        'asset-1': {
          id: 'asset-1',
          name: 'Home',
          purchaseDate: { type: 'now' as const },
          purchasePrice: 400000,
          appreciationRate: 3,
          saleDate: { type: 'atLifeExpectancy' as const },
          paymentMethod: {
            type: 'loan',
            downPayment: 80000,
            loanBalance: 320000,
            apr: 6,
            monthlyPayment: 1918.56, // Standard 30yr payment at 6% APR on $320k
          },
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const result = new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);

    // Verify physical assets data is tracked over time
    expect(result.data[1].physicalAssets).not.toBeNull();
    expect(result.data[1].physicalAssets!.perAssetData['asset-1']).toBeDefined();

    // Year 1: Equity should be positive (appreciation + principal paydown)
    const year1Equity = result.data[1].physicalAssets!.perAssetData['asset-1'].equity;
    expect(year1Equity).toBeGreaterThan(80000); // More than initial down payment

    // Year 5: Equity should have grown further
    const year5 = result.data[5];
    if (year5?.physicalAssets?.perAssetData['asset-1']) {
      const year5Equity = year5.physicalAssets.perAssetData['asset-1'].equity;
      expect(year5Equity).toBeGreaterThan(year1Equity);
    }
  });

  it('should apply capital loss deduction when physical asset sold at a loss', () => {
    const inputs = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 50 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 50000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 100000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 50000 }) },
      physicalAssets: {
        'asset-1': {
          id: 'asset-1',
          name: 'Depreciated Property',
          purchaseDate: { type: 'now' as const },
          purchasePrice: 200000, // Cost basis
          appreciationRate: -20, // Severe depreciation
          saleDate: { type: 'customAge' as const, age: 37 }, // Sell after 3 years of depreciation
          paymentMethod: { type: 'cash' },
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const result = new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);

    // Find year when sale occurs - sale proceeds are positive even though there's a loss
    // (because it's unfinanced, saleProceeds = marketValue which is still positive)
    const saleYearData = result.data.find((d) => d.physicalAssets?.perAssetData['asset-1']?.isSold === true);
    expect(saleYearData).toBeDefined();

    // Capital gain should be negative (a loss) since marketValue < purchasePrice
    expect(saleYearData!.physicalAssets!.totalCapitalGain).toBeLessThan(0);

    // Realized gains should be 0 (losses don't create taxable gains)
    expect(saleYearData!.taxes!.incomeSources.realizedGains).toBe(0);

    // Capital loss deduction should be applied (up to $3,000)
    expect(saleYearData!.taxes!.incomeSources.capitalLossDeduction).toBeGreaterThan(0);
    expect(saleYearData!.taxes!.incomeSources.capitalLossDeduction).toBeLessThanOrEqual(3000);
  });

  it('should handle underwater sale where loan exceeds market value', () => {
    // Create an extremely underwater scenario:
    // - Minimal down payment (1%)
    // - Severe depreciation (-50%/year)
    // - Quick sale at age 36 (only ~1 year of ownership)
    const inputs = createSimulatorInputs({
      timeline: { ...createDefaultTimeline(), birthYear: 1990, lifeExpectancy: 50 },
      accounts: { 'account-1': createSavingsAccount({ id: 'account-1', balance: 100000 }) },
      incomes: { 'income-1': createWageIncome({ id: 'income-1', amount: 150000 }) },
      expenses: { 'expense-1': createLivingExpense({ id: 'expense-1', amount: 60000 }) },
      physicalAssets: {
        'asset-1': {
          id: 'asset-1',
          name: 'Underwater Property',
          purchaseDate: { type: 'now' as const },
          purchasePrice: 500000,
          appreciationRate: -50, // Extreme depreciation (50% value loss per year)
          paymentMethod: {
            type: 'loan',
            downPayment: 5000, // Only 1% down (99% LTV)
            loanBalance: 495000,
            apr: 6,
            monthlyPayment: 2967.73, // Standard 30yr payment at 6% APR on $495k
          },
          saleDate: { type: 'customAge' as const, age: 36 }, // Sell after ~1 year
        },
      },
      contributionRules: {},
      baseContributionRule: { type: 'save' },
    });

    const result = new FinancialSimulationEngine(inputs).runSimulation(new FixedReturnsProvider(inputs), inputs.timeline!);

    // Find year when sale occurs using isSold flag
    const saleYearData = result.data.find((d) => d.physicalAssets?.perAssetData['asset-1']?.isSold === true);
    expect(saleYearData).toBeDefined();

    const physicalAssetsData = saleYearData!.physicalAssets!;

    // Sale proceeds should be negative (underwater: marketValue < loanBalance)
    // After ~1 year at -50%: marketValue ~= 500,000 * 0.5 = 250,000
    // Loan balance after 1 year is still ~490,000 (mostly interest early in loan)
    // saleProceeds = marketValue - loanBalance = 250,000 - 490,000 = -240,000 (approximately)
    expect(physicalAssetsData.totalSaleProceeds).toBeLessThan(0);

    // Verify the new fields for underwater sales are correctly populated:
    // saleMarketValue should be positive (the actual market value at sale)
    expect(physicalAssetsData.totalSaleMarketValue).toBeGreaterThan(0);
    // securedDebtPaidAtSale should be the loan balance that was paid off
    expect(physicalAssetsData.totalSecuredDebtPaidAtSale).toBeGreaterThan(0);
    // securedDebtPaidAtSale > saleMarketValue for underwater sales
    expect(physicalAssetsData.totalSecuredDebtPaidAtSale).toBeGreaterThan(physicalAssetsData.totalSaleMarketValue);
    // Verify the relationship: saleProceeds = saleMarketValue - securedDebtPaidAtSale
    expect(physicalAssetsData.totalSaleProceeds).toBeCloseTo(
      physicalAssetsData.totalSaleMarketValue - physicalAssetsData.totalSecuredDebtPaidAtSale,
      0
    );

    // Verify the simulation continues and handles the deficit
    // The negative proceeds reduce surplus, requiring withdrawals or reducing contributions
    const yearAfterSale = result.data[result.data.indexOf(saleYearData!) + 1];
    expect(yearAfterSale).toBeDefined();

    // Portfolio should still have a reasonable value (deficit handled via withdrawals or reduced contributions)
    expect(yearAfterSale.portfolio.totalValue).toBeGreaterThanOrEqual(0);
  });
});
