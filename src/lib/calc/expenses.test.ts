import { describe, it, expect } from 'vitest';

import { Expense, Expenses, ExpensesProcessor } from './expenses';
import type { ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';
import type { SimulationState } from './simulation-engine';

/**
 * Expense Processing Tests
 *
 * Tests for:
 * - Timeframe start/end (customAge, customDate, now, atRetirement)
 * - Growth rate application (yearly, with limits)
 * - Frequency handling (yearly, monthly, oneTime, etc.)
 * - Discretionary expenses
 */

// Helper to create a mock simulation state
const createSimulationState = (overrides: Partial<SimulationState> = {}): SimulationState => ({
  time: {
    age: 35,
    year: 2024,
    month: 1,
    date: new Date(2024, 0, 1),
    ...overrides.time,
  },
  phase: overrides.phase !== undefined ? overrides.phase : { name: 'accumulation' },
  portfolio: {} as SimulationState['portfolio'],
  annualData: { expenses: [] },
});

// Helper to create expense input
const createExpenseInput = (overrides: Partial<ExpenseInputs> = {}): ExpenseInputs => ({
  id: 'expense-1',
  name: 'Living Expenses',
  amount: 5000, // Per period amount
  frequency: 'monthly',
  disabled: false,
  timeframe: {
    start: { type: 'now' },
    end: undefined,
  },
  growth: undefined,
  ...overrides,
});

describe('Expense Timeframe Tests', () => {
  describe('Start Timeframe', () => {
    it('now: expense is active immediately', () => {
      const expense = new Expense(
        createExpenseInput({
          timeframe: { start: { type: 'now' }, end: undefined },
        })
      );

      const simState = createSimulationState();
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);
    });

    it('customAge: expense starts at specified age', () => {
      const expense = new Expense(
        createExpenseInput({
          timeframe: { start: { type: 'customAge', age: 65 }, end: undefined },
        })
      );

      // Before age 65
      let simState = createSimulationState({ time: { age: 64, year: 2053, month: 1, date: new Date(2053, 0, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);

      // At age 65
      simState = createSimulationState({ time: { age: 65, year: 2054, month: 1, date: new Date(2054, 0, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);

      // After age 65
      simState = createSimulationState({ time: { age: 70, year: 2059, month: 1, date: new Date(2059, 0, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);
    });

    it('customDate: expense starts at specified date', () => {
      const expense = new Expense(
        createExpenseInput({
          timeframe: { start: { type: 'customDate', year: 2026, month: 3 }, end: undefined },
        })
      );

      // Before March 2026
      let simState = createSimulationState({ time: { age: 37, year: 2026, month: 2, date: new Date(2026, 1, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);

      // At March 2026
      simState = createSimulationState({ time: { age: 37, year: 2026.167, month: 3, date: new Date(2026, 2, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);
    });

    it('atRetirement: expense starts when retirement phase begins', () => {
      const expense = new Expense(
        createExpenseInput({
          timeframe: { start: { type: 'atRetirement' }, end: undefined },
        })
      );

      // Pre-retirement phase
      let simState = createSimulationState({
        phase: { name: 'accumulation' } as SimulationState['phase'],
      });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);

      // Retirement phase
      simState = createSimulationState({
        phase: { name: 'retirement' } as SimulationState['phase'],
      });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);
    });
  });

  describe('End Timeframe', () => {
    it('no end: expense continues indefinitely', () => {
      const expense = new Expense(
        createExpenseInput({
          timeframe: { start: { type: 'now' }, end: undefined },
        })
      );

      const simState = createSimulationState({ time: { age: 95, year: 2084, month: 1, date: new Date(2084, 0, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);
    });

    it('customAge: expense ends at specified age', () => {
      const expense = new Expense(
        createExpenseInput({
          timeframe: { start: { type: 'now' }, end: { type: 'customAge', age: 50 } },
        })
      );

      // Before age 50
      let simState = createSimulationState({ time: { age: 49, year: 2038, month: 12, date: new Date(2038, 11, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);

      // At age 50
      simState = createSimulationState({ time: { age: 50, year: 2039, month: 1, date: new Date(2039, 0, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);

      // After age 50
      simState = createSimulationState({ time: { age: 51, year: 2040, month: 1, date: new Date(2040, 0, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);
    });

    it('customDate: expense ends at specified date', () => {
      const expense = new Expense(
        createExpenseInput({
          timeframe: { start: { type: 'now' }, end: { type: 'customDate', year: 2028, month: 6 } },
        })
      );

      // Before June 2028
      let simState = createSimulationState({ time: { age: 39, year: 2028, month: 5, date: new Date(2028, 4, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);

      // After June 2028
      simState = createSimulationState({ time: { age: 39, year: 2028.583, month: 7, date: new Date(2028, 6, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);
    });

    it('atRetirement: expense ends when retirement phase begins', () => {
      const expense = new Expense(
        createExpenseInput({
          timeframe: { start: { type: 'now' }, end: { type: 'atRetirement' } },
        })
      );

      // Pre-retirement phase
      let simState = createSimulationState({
        phase: { name: 'accumulation' } as SimulationState['phase'],
      });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);

      // Retirement phase
      simState = createSimulationState({
        phase: { name: 'retirement' } as SimulationState['phase'],
      });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);
    });
  });

  describe('Timeframe Boundary Conditions', () => {
    it('expense with customDate range is only active within range', () => {
      const expense = new Expense(
        createExpenseInput({
          name: 'Child Expenses',
          timeframe: {
            start: { type: 'customDate', year: 2024, month: 1 },
            end: { type: 'customDate', year: 2042, month: 6 }, // Kid turns 18
          },
        })
      );

      // Before range
      let simState = createSimulationState({ time: { age: 34, year: 2023, month: 12, date: new Date(2023, 11, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);

      // Within range
      simState = createSimulationState({ time: { age: 45, year: 2034, month: 1, date: new Date(2034, 0, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);

      // After range
      simState = createSimulationState({ time: { age: 54, year: 2043, month: 1, date: new Date(2043, 0, 1) } });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);
    });

    it('expense active only during pre-retirement', () => {
      const expense = new Expense(
        createExpenseInput({
          name: 'Commuting',
          timeframe: {
            start: { type: 'now' },
            end: { type: 'atRetirement' },
          },
        })
      );

      // Pre-retirement
      let simState = createSimulationState({
        phase: { name: 'accumulation' } as SimulationState['phase'],
      });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);

      // Retirement
      simState = createSimulationState({
        phase: { name: 'retirement' } as SimulationState['phase'],
      });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);
    });

    it('expense active only during retirement', () => {
      const expense = new Expense(
        createExpenseInput({
          name: 'Healthcare Premium',
          timeframe: {
            start: { type: 'atRetirement' },
            end: undefined,
          },
        })
      );

      // Pre-retirement
      let simState = createSimulationState({
        phase: { name: 'accumulation' } as SimulationState['phase'],
      });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(false);

      // Retirement
      simState = createSimulationState({
        phase: { name: 'retirement' } as SimulationState['phase'],
      });
      expect(expense.getIsActiveByTimeFrame(simState)).toBe(true);
    });
  });
});

describe('Expense Growth Rate Tests', () => {
  it('applies growth rate annually (year change)', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 5000, // $5k/month = $60k/year
        frequency: 'monthly',
        growth: { growthRate: 3, growthLimit: undefined }, // 3% annual growth (inflation)
      })
    );

    // First call of year 1 - growth is applied (since lastYear starts at 0)
    const year1Result = expense.processMonthlyAmount(2024);
    expect(year1Result.expense).toBeCloseTo(5000 * 1.03);

    // Still year 1 (no additional growth)
    const year1Result2 = expense.processMonthlyAmount(2024.5);
    expect(year1Result2.expense).toBeCloseTo(5000 * 1.03);

    // Year 2 - growth applied again
    const year2Result = expense.processMonthlyAmount(2025);
    expect(year2Result.expense).toBeCloseTo(5000 * 1.03 * 1.03);
  });

  it('compounds growth over multiple years', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 5000,
        frequency: 'monthly',
        growth: { growthRate: 3, growthLimit: undefined }, // 3% annual inflation
      })
    );

    // Year 1 (growth applied on first call since lastYear starts at 0)
    expense.processMonthlyAmount(2024);

    // Year 2 (3% additional growth)
    expense.processMonthlyAmount(2025);

    // Year 3 (another 3% on top)
    expense.processMonthlyAmount(2026);

    // Continue through Year 10
    for (let year = 2027; year <= 2033; year++) {
      expense.processMonthlyAmount(year);
    }

    const year10Result = expense.processMonthlyAmount(2034);
    // 11 years of 3% compound growth (2024-2034 inclusive = 11 year changes)
    expect(year10Result.expense).toBeCloseTo(5000 * Math.pow(1.03, 11));
  });

  it('respects upper growth limit with positive growth', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 5000,
        frequency: 'monthly',
        growth: { growthRate: 100, growthLimit: 72000 }, // 100% annual growth, max $72k/year
      })
    );

    // Year 1: $60k annual
    expense.processMonthlyAmount(2024);

    // Year 2: Would be $120k but capped at $72k
    const year2Result = expense.processMonthlyAmount(2025);
    expect(year2Result.expense).toBeCloseTo(72000 / 12);
  });

  it('respects lower growth limit with negative growth', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 5000,
        frequency: 'monthly',
        growth: { growthRate: -50, growthLimit: 36000 }, // -50% annual, min $36k/year
      })
    );

    // Year 1: $60k annual
    expense.processMonthlyAmount(2024);

    // Year 2: Would be $30k but floor is $36k
    const year2Result = expense.processMonthlyAmount(2025);
    expect(year2Result.expense).toBeCloseTo(36000 / 12);
  });

  it('handles zero growth correctly', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 4000,
        frequency: 'monthly',
        growth: { growthRate: 0, growthLimit: undefined },
      })
    );

    expense.processMonthlyAmount(2024);
    const year5Result = expense.processMonthlyAmount(2028);

    expect(year5Result.expense).toBeCloseTo(4000);
  });

  it('handles no growth config', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 3000,
        frequency: 'monthly',
        growth: undefined,
      })
    );

    expense.processMonthlyAmount(2024);
    const year10Result = expense.processMonthlyAmount(2033);

    expect(year10Result.expense).toBeCloseTo(3000);
  });
});

describe('Expense Frequency Tests', () => {
  it('monthly: processes full amount each month', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 5000,
        frequency: 'monthly',
      })
    );

    const result = expense.processMonthlyAmount(2024);
    expect(result.expense).toBeCloseTo(5000);
  });

  it('yearly: distributes amount across 12 months', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 12000, // Annual insurance premium
        frequency: 'yearly',
      })
    );

    const result = expense.processMonthlyAmount(2024);
    // $12k / 12 months = $1k/month
    expect(result.expense).toBeCloseTo(1000);
  });

  it('quarterly: distributes quarterly amount across months', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 3000, // Per quarter (property tax)
        frequency: 'quarterly',
      })
    );

    const result = expense.processMonthlyAmount(2024);
    // 4 quarters * $3k = $12k annual / 12 = $1k per month
    expect(result.expense).toBeCloseTo(1000);
  });

  it('biweekly: distributes biweekly amount across months', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 500, // Per biweekly period
        frequency: 'biweekly',
      })
    );

    const result = expense.processMonthlyAmount(2024);
    // 26 periods * $500 / 12 months = $1083.33
    expect(result.expense).toBeCloseTo(1083.33, 0);
  });

  it('weekly: distributes weekly amount across months', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 200, // Per week (groceries)
        frequency: 'weekly',
      })
    );

    const result = expense.processMonthlyAmount(2024);
    // 52 weeks * $200 / 12 months = $866.67
    expect(result.expense).toBeCloseTo(866.67, 0);
  });

  it('oneTime: processes once and then returns zero', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 20000, // One-time car purchase
        frequency: 'oneTime',
      })
    );

    // First month - full amount
    const result1 = expense.processMonthlyAmount(2024);
    expect(result1.expense).toBe(20000);

    // Second month - zero (already occurred)
    const result2 = expense.processMonthlyAmount(2024.083);
    expect(result2.expense).toBe(0);

    // Next year - still zero
    const result3 = expense.processMonthlyAmount(2025);
    expect(result3.expense).toBe(0);
  });
});

describe('Expenses Collection Tests', () => {
  it('filters active expenses by timeframe', () => {
    const expenses = new Expenses([
      createExpenseInput({
        id: 'active',
        name: 'Rent',
        timeframe: { start: { type: 'now' }, end: undefined },
      }),
      createExpenseInput({
        id: 'future',
        name: 'Retirement Travel',
        timeframe: { start: { type: 'atRetirement' }, end: undefined },
      }),
      createExpenseInput({
        id: 'past',
        name: 'Student Loans',
        timeframe: { start: { type: 'now' }, end: { type: 'customAge', age: 30 } },
      }),
    ]);

    const simState = createSimulationState({ time: { age: 35, year: 2024, month: 1, date: new Date(2024, 0, 1) } });
    const activeExpenses = expenses.getActiveExpensesByTimeFrame(simState);

    expect(activeExpenses.length).toBe(1);
    expect(activeExpenses[0].processMonthlyAmount(2024).name).toBe('Rent');
  });

  it('excludes disabled expenses', () => {
    const expenses = new Expenses([
      createExpenseInput({ id: 'enabled', name: 'Enabled', disabled: false }),
      createExpenseInput({ id: 'disabled', name: 'Disabled', disabled: true }),
    ]);

    const simState = createSimulationState();
    const activeExpenses = expenses.getActiveExpensesByTimeFrame(simState);

    expect(activeExpenses.length).toBe(1);
    expect(activeExpenses[0].processMonthlyAmount(2024).name).toBe('Enabled');
  });
});

describe('ExpensesProcessor Tests', () => {
  it('aggregates multiple expenses correctly', () => {
    const expenses = new Expenses([
      createExpenseInput({
        id: 'rent',
        name: 'Rent',
        amount: 2000,
        frequency: 'monthly',
      }),
      createExpenseInput({
        id: 'food',
        name: 'Food',
        amount: 800,
        frequency: 'monthly',
      }),
      createExpenseInput({
        id: 'utilities',
        name: 'Utilities',
        amount: 300,
        frequency: 'monthly',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new ExpensesProcessor(simState, expenses);
    const result = processor.process();

    expect(result.totalExpenses).toBeCloseTo(3100);
    expect(Object.keys(result.perExpenseData).length).toBe(3);
    expect(result.perExpenseData['rent'].expense).toBeCloseTo(2000);
    expect(result.perExpenseData['food'].expense).toBeCloseTo(800);
    expect(result.perExpenseData['utilities'].expense).toBeCloseTo(300);
  });

  it('annual data sums monthly data correctly', () => {
    const expenses = new Expenses([
      createExpenseInput({
        id: 'rent',
        name: 'Rent',
        amount: 2000,
        frequency: 'monthly',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new ExpensesProcessor(simState, expenses);

    // Process 12 months
    for (let month = 0; month < 12; month++) {
      processor.process();
    }

    const annualData = processor.getAnnualData();
    expect(annualData.totalExpenses).toBeCloseTo(24000);
  });

  it('handles discretionary expenses', () => {
    const expenses = new Expenses([
      createExpenseInput({
        id: 'fixed',
        name: 'Fixed Expenses',
        amount: 5000,
        frequency: 'monthly',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new ExpensesProcessor(simState, expenses);

    // Process regular expenses first
    processor.process();

    // Add discretionary spending (extra cash to spend)
    const result = processor.processDiscretionaryExpense(2000);

    expect(result.totalExpenses).toBeCloseTo(7000); // 5000 + 2000
    expect(result.perExpenseData['4ad31cac-7e17-47c4-af4e-784e080c05dd'].expense).toBe(2000);
  });

  it('accumulates discretionary expenses within same month', () => {
    const expenses = new Expenses([
      createExpenseInput({
        id: 'fixed',
        name: 'Fixed Expenses',
        amount: 3000,
        frequency: 'monthly',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new ExpensesProcessor(simState, expenses);

    // Process regular expenses
    processor.process();

    // Add discretionary spending multiple times
    processor.processDiscretionaryExpense(500);
    const result = processor.processDiscretionaryExpense(700);

    expect(result.totalExpenses).toBeCloseTo(4200); // 3000 + 500 + 700
    expect(result.perExpenseData['4ad31cac-7e17-47c4-af4e-784e080c05dd'].expense).toBe(1200);
  });

  it('resets monthly data correctly', () => {
    const expenses = new Expenses([
      createExpenseInput({
        id: 'expense',
        name: 'Monthly Expense',
        amount: 1000,
        frequency: 'monthly',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new ExpensesProcessor(simState, expenses);

    // Process some months
    processor.process();
    processor.process();
    processor.process();

    let annualData = processor.getAnnualData();
    expect(annualData.totalExpenses).toBeCloseTo(3000);

    // Reset
    processor.resetMonthlyData();

    // Get annual data after reset
    annualData = processor.getAnnualData();
    expect(annualData.totalExpenses).toBe(0);
  });
});

describe('Expense Edge Cases', () => {
  it('handles very small expense amounts', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 0.01, // $0.01/month
        frequency: 'monthly',
      })
    );

    const result = expense.processMonthlyAmount(2024);
    expect(result.expense).toBeCloseTo(0.01);
  });

  it('handles large expense amounts', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 100000, // $100k/month luxury spending
        frequency: 'monthly',
      })
    );

    const result = expense.processMonthlyAmount(2024);
    expect(result.expense).toBeCloseTo(100000);
  });

  it('expense amounts never go negative', () => {
    const expense = new Expense(
      createExpenseInput({
        amount: 1000,
        frequency: 'monthly',
        growth: { growthRate: -99, growthLimit: 0 }, // Extreme negative growth
      })
    );

    expense.processMonthlyAmount(2024);
    const result = expense.processMonthlyAmount(2025);

    expect(result.expense).toBeGreaterThanOrEqual(0);
  });
});
