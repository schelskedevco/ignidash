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
