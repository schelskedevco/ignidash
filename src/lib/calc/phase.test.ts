import { describe, it, expect } from 'vitest';

import type { TimelineInputs } from '@/lib/schemas/inputs/timeline-form-schema';

import { PhaseIdentifier, type PhaseData } from './phase';
import type { SimulationState } from './simulation-engine';
import type { Portfolio } from './portfolio';
import type { ExpensesData } from './expenses';
import type { DebtsData } from './debts';
import type { PhysicalAssetsData } from './physical-assets';
import { createEmptyExpensesData, createEmptyDebtsData, createEmptyPhysicalAssetsData } from './__tests__/test-utils';

/**
 * PhaseIdentifier Tests
 *
 * Tests for retirement strategy phase transitions:
 * - fixedAge: simple age-based transition
 * - swrTarget: SWR-based transition considering expenses, debts, and physical asset loans
 */

// ============================================================================
// Test Helpers
// ============================================================================

const createMockPortfolio = (totalValue: number): Portfolio =>
  ({
    getTotalValue: () => totalValue,
  }) as unknown as Portfolio;

const createSimulationState = (overrides: {
  age?: number;
  phase?: PhaseData | null;
  portfolio?: Portfolio;
  expenses?: ExpensesData[];
  debts?: DebtsData[];
  physicalAssets?: PhysicalAssetsData[];
}): SimulationState => ({
  time: {
    age: overrides.age ?? 35,
    year: 2024,
    month: 1,
    date: new Date(2024, 0, 1),
  },
  phase: overrides.phase !== undefined ? overrides.phase : { name: 'accumulation' },
  portfolio: overrides.portfolio ?? createMockPortfolio(1_000_000),
  annualData: {
    expenses: overrides.expenses ?? [],
    debts: overrides.debts ?? [],
    physicalAssets: overrides.physicalAssets ?? [],
  },
});

const createFixedAgeTimeline = (retirementAge: number): TimelineInputs => ({
  lifeExpectancy: 87,
  birthMonth: 1,
  birthYear: 1990,
  retirementStrategy: { type: 'fixedAge', retirementAge },
});

const createSwrTargetTimeline = (safeWithdrawalRate: number): TimelineInputs => ({
  lifeExpectancy: 87,
  birthMonth: 1,
  birthYear: 1990,
  retirementStrategy: { type: 'swrTarget', safeWithdrawalRate },
});

// ============================================================================
// fixedAge Strategy Tests
// ============================================================================

describe('PhaseIdentifier - fixedAge Strategy', () => {
  it('returns accumulation when age < retirementAge', () => {
    const timeline = createFixedAgeTimeline(65);
    const state = createSimulationState({ age: 35 });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
  });

  it('returns retirement when age === retirementAge', () => {
    const timeline = createFixedAgeTimeline(65);
    const state = createSimulationState({ age: 65 });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
  });

  it('returns retirement when age > retirementAge', () => {
    const timeline = createFixedAgeTimeline(65);
    const state = createSimulationState({ age: 70 });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
  });

  it('handles early retirement age', () => {
    const timeline = createFixedAgeTimeline(40);
    const state = createSimulationState({ age: 40 });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
  });
});

// ============================================================================
// swrTarget Strategy - Core Logic Tests
// ============================================================================

describe('PhaseIdentifier - swrTarget Strategy', () => {
  describe('Expenses only', () => {
    // With $1M portfolio and 4% SWR = $40,000 safe withdrawal amount

    it('stays in accumulation when mean expenses > SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [
          createEmptyExpensesData({ totalExpenses: 50_000 }), // Above $40k SWR
        ],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });

    it('transitions to retirement when mean expenses < SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [
          createEmptyExpensesData({ totalExpenses: 30_000 }), // Below $40k SWR
        ],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });

    it('calculates mean across multiple expense periods', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [
          createEmptyExpensesData({ totalExpenses: 20_000 }),
          createEmptyExpensesData({ totalExpenses: 40_000 }),
          createEmptyExpensesData({ totalExpenses: 30_000 }),
          // Mean = 30_000 < 40_000 SWR
        ],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });
  });

  describe('Unsecured debts only', () => {
    it('stays in accumulation when debt payments > SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 0 })], // No expenses
        debts: [
          createEmptyDebtsData({ totalPayment: 50_000 }), // Above $40k SWR
        ],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });

    it('transitions to retirement when debt payments < SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 0 })], // No expenses
        debts: [
          createEmptyDebtsData({ totalPayment: 20_000 }), // Below $40k SWR
        ],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });
  });

  describe('Secured debts (physical asset loans) only', () => {
    it('stays in accumulation when loan payments > SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 0 })], // No expenses
        physicalAssets: [
          createEmptyPhysicalAssetsData({ totalLoanPayment: 50_000 }), // Above $40k SWR
        ],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });

    it('transitions to retirement when loan payments < SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 0 })], // No expenses
        physicalAssets: [
          createEmptyPhysicalAssetsData({ totalLoanPayment: 20_000 }), // Below $40k SWR
        ],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });
  });
});

// ============================================================================
// swrTarget Strategy - Combination Tests
// ============================================================================

describe('PhaseIdentifier - swrTarget Strategy Combinations', () => {
  describe('Expenses + unsecured debts', () => {
    it('stays in accumulation when combined total > SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 25_000 })],
        debts: [createEmptyDebtsData({ totalPayment: 20_000 })],
        // Combined = 45_000 > 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });

    it('transitions to retirement when combined total < SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 15_000 })],
        debts: [createEmptyDebtsData({ totalPayment: 10_000 })],
        // Combined = 25_000 < 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });
  });

  describe('Expenses + secured debts', () => {
    it('stays in accumulation when combined total > SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 25_000 })],
        physicalAssets: [createEmptyPhysicalAssetsData({ totalLoanPayment: 20_000 })],
        // Combined = 45_000 > 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });

    it('transitions to retirement when combined total < SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 15_000 })],
        physicalAssets: [createEmptyPhysicalAssetsData({ totalLoanPayment: 10_000 })],
        // Combined = 25_000 < 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });
  });

  describe('Unsecured + secured debts', () => {
    it('stays in accumulation when combined debt payments > SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 0 })], // No expenses
        debts: [createEmptyDebtsData({ totalPayment: 25_000 })],
        physicalAssets: [createEmptyPhysicalAssetsData({ totalLoanPayment: 20_000 })],
        // Combined = 45_000 > 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });

    it('transitions to retirement when combined debt payments < SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 0 })], // No expenses
        debts: [createEmptyDebtsData({ totalPayment: 15_000 })],
        physicalAssets: [createEmptyPhysicalAssetsData({ totalLoanPayment: 10_000 })],
        // Combined = 25_000 < 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });
  });

  describe('All three: expenses + unsecured + secured debts', () => {
    it('stays in accumulation when all combined > SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 20_000 })],
        debts: [createEmptyDebtsData({ totalPayment: 15_000 })],
        physicalAssets: [createEmptyPhysicalAssetsData({ totalLoanPayment: 10_000 })],
        // Combined = 45_000 > 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });

    it('transitions to retirement when all combined < SWR amount', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 15_000 })],
        debts: [createEmptyDebtsData({ totalPayment: 5_000 })],
        physicalAssets: [createEmptyPhysicalAssetsData({ totalLoanPayment: 5_000 })],
        // Combined = 25_000 < 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });

    it('calculates mean across multiple periods for all components', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [
          createEmptyExpensesData({ totalExpenses: 10_000 }),
          createEmptyExpensesData({ totalExpenses: 20_000 }),
          // Mean expenses = 15_000
        ],
        debts: [
          createEmptyDebtsData({ totalPayment: 4_000 }),
          createEmptyDebtsData({ totalPayment: 6_000 }),
          // Mean debts = 5_000
        ],
        physicalAssets: [
          createEmptyPhysicalAssetsData({ totalLoanPayment: 8_000 }),
          createEmptyPhysicalAssetsData({ totalLoanPayment: 12_000 }),
          // Mean physical assets = 10_000
        ],
        // Combined mean = 30_000 < 40_000 SWR
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });
  });
});

// ============================================================================
// swrTarget Strategy - Edge Cases
// ============================================================================

describe('PhaseIdentifier - swrTarget Strategy Edge Cases', () => {
  it('returns accumulation when annualData.expenses is empty', () => {
    const timeline = createSwrTargetTimeline(4);
    const state = createSimulationState({
      portfolio: createMockPortfolio(1_000_000),
      expenses: [], // Empty
    });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
  });

  it('handles zero expenses with debt payments', () => {
    const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
    const state = createSimulationState({
      portfolio: createMockPortfolio(1_000_000),
      expenses: [createEmptyExpensesData({ totalExpenses: 0 })],
      debts: [createEmptyDebtsData({ totalPayment: 30_000 })],
      // Combined = 30_000 < 40_000 SWR
    });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
  });

  it('sticky retirement: once retired, stays retired regardless of SWR', () => {
    const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
    const state = createSimulationState({
      phase: { name: 'retirement' }, // Already retired
      portfolio: createMockPortfolio(1_000_000),
      expenses: [
        createEmptyExpensesData({ totalExpenses: 100_000 }), // Way above SWR
      ],
    });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    // Should stay retired even though expenses exceed SWR
    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
  });

  it('boundary: exactly equal to SWR amount transitions to retirement', () => {
    const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
    const state = createSimulationState({
      portfolio: createMockPortfolio(1_000_000),
      expenses: [
        createEmptyExpensesData({ totalExpenses: 40_000 }), // Exactly equal to SWR
      ],
    });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    // expenses (40k) is NOT less than SWR amount (40k), so stays accumulation
    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
  });

  it('boundary: just below SWR amount transitions to retirement', () => {
    const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
    const state = createSimulationState({
      portfolio: createMockPortfolio(1_000_000),
      expenses: [
        createEmptyExpensesData({ totalExpenses: 39_999 }), // Just below SWR
      ],
    });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
  });

  it('handles empty debts and physicalAssets arrays', () => {
    const timeline = createSwrTargetTimeline(4); // 4% SWR = $40k
    const state = createSimulationState({
      portfolio: createMockPortfolio(1_000_000),
      expenses: [createEmptyExpensesData({ totalExpenses: 30_000 })],
      debts: [], // Empty
      physicalAssets: [], // Empty
    });
    const phaseIdentifier = new PhaseIdentifier(state, timeline);

    // Only expenses (30k) < SWR (40k), so retirement
    expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
  });
});

// ============================================================================
// swrTarget Strategy - Variable SWR Rates
// ============================================================================

describe('PhaseIdentifier - swrTarget Strategy Variable SWR Rates', () => {
  describe('2% SWR (conservative)', () => {
    // $1M * 2% = $20,000 safe withdrawal

    it('transitions to retirement with low expenses', () => {
      const timeline = createSwrTargetTimeline(2);
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 15_000 })],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });

    it('stays in accumulation with moderate expenses', () => {
      const timeline = createSwrTargetTimeline(2);
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 30_000 })],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });
  });

  describe('4% SWR (traditional)', () => {
    // $1M * 4% = $40,000 safe withdrawal

    it('transitions to retirement with moderate expenses', () => {
      const timeline = createSwrTargetTimeline(4);
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 35_000 })],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });

    it('stays in accumulation with higher expenses', () => {
      const timeline = createSwrTargetTimeline(4);
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 50_000 })],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });
  });

  describe('6% SWR (aggressive)', () => {
    // $1M * 6% = $60,000 safe withdrawal

    it('transitions to retirement with higher expenses', () => {
      const timeline = createSwrTargetTimeline(6);
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 50_000 })],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });

    it('stays in accumulation with very high expenses', () => {
      const timeline = createSwrTargetTimeline(6);
      const state = createSimulationState({
        portfolio: createMockPortfolio(1_000_000),
        expenses: [createEmptyExpensesData({ totalExpenses: 70_000 })],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'accumulation' });
    });
  });

  describe('Variable portfolio sizes', () => {
    it('smaller portfolio requires lower expenses for retirement', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR
      const state = createSimulationState({
        portfolio: createMockPortfolio(500_000), // $500k * 4% = $20k SWR
        expenses: [createEmptyExpensesData({ totalExpenses: 15_000 })],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });

    it('larger portfolio allows higher expenses for retirement', () => {
      const timeline = createSwrTargetTimeline(4); // 4% SWR
      const state = createSimulationState({
        portfolio: createMockPortfolio(2_000_000), // $2M * 4% = $80k SWR
        expenses: [createEmptyExpensesData({ totalExpenses: 70_000 })],
      });
      const phaseIdentifier = new PhaseIdentifier(state, timeline);

      expect(phaseIdentifier.getCurrentPhase()).toEqual({ name: 'retirement' });
    });
  });
});
