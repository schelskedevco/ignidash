import { describe, it, expect } from 'vitest';

import { Income, Incomes, IncomesProcessor } from './incomes';
import type { IncomeInputs } from '@/lib/schemas/inputs/income-form-schema';
import type { SimulationState } from './simulation-engine';

/**
 * Income Processing Tests
 *
 * Tests for:
 * - Timeframe start/end (customAge, customDate, now, atRetirement)
 * - Growth rate application (yearly, with limits)
 * - Income type tax handling (wage, socialSecurity, exempt)
 * - Frequency handling (yearly, monthly, oneTime, etc.)
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

// Helper to create income input
const createIncomeInput = (overrides: Partial<IncomeInputs> = {}): IncomeInputs => ({
  id: 'income-1',
  name: 'Salary',
  amount: 10000, // Per period amount
  frequency: 'monthly',
  disabled: false,
  timeframe: {
    start: { type: 'now' },
    end: undefined,
  },
  taxes: {
    incomeType: 'wage',
    withholding: 22,
  },
  growth: undefined,
  ...overrides,
});

describe('Income Timeframe Tests', () => {
  describe('Start Timeframe', () => {
    it('now: income is active immediately', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: { start: { type: 'now' }, end: undefined },
        })
      );

      const simState = createSimulationState();
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);
    });

    it('customAge: income starts at specified age', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: { start: { type: 'customAge', age: 40 }, end: undefined },
        })
      );

      // Before age 40
      let simState = createSimulationState({ time: { age: 39, year: 2024, month: 1, date: new Date(2024, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(false);

      // At age 40
      simState = createSimulationState({ time: { age: 40, year: 2029, month: 1, date: new Date(2029, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);

      // After age 40
      simState = createSimulationState({ time: { age: 45, year: 2034, month: 1, date: new Date(2034, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);
    });

    it('customDate: income starts at specified date', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: { start: { type: 'customDate', year: 2025, month: 6 }, end: undefined },
        })
      );

      // Before June 2025
      let simState = createSimulationState({ time: { age: 35, year: 2025, month: 5, date: new Date(2025, 4, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(false);

      // At June 2025
      simState = createSimulationState({ time: { age: 35, year: 2025.416, month: 6, date: new Date(2025, 5, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);

      // After June 2025
      simState = createSimulationState({ time: { age: 36, year: 2026, month: 1, date: new Date(2026, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);
    });

    it('atRetirement: income starts when retirement phase begins', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: { start: { type: 'atRetirement' }, end: undefined },
        })
      );

      // Pre-retirement phase
      let simState = createSimulationState({
        phase: { name: 'accumulation' } as SimulationState['phase'],
      });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(false);

      // Retirement phase
      simState = createSimulationState({
        phase: { name: 'retirement' } as SimulationState['phase'],
      });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);
    });
  });

  describe('End Timeframe', () => {
    it('no end: income continues indefinitely', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: { start: { type: 'now' }, end: undefined },
        })
      );

      const simState = createSimulationState({ time: { age: 100, year: 2089, month: 1, date: new Date(2089, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);
    });

    it('customAge: income ends at specified age', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: { start: { type: 'now' }, end: { type: 'customAge', age: 65 } },
        })
      );

      // Before age 65
      let simState = createSimulationState({ time: { age: 64, year: 2053, month: 12, date: new Date(2053, 11, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);

      // At age 65
      simState = createSimulationState({ time: { age: 65, year: 2054, month: 1, date: new Date(2054, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);

      // After age 65
      simState = createSimulationState({ time: { age: 66, year: 2055, month: 1, date: new Date(2055, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(false);
    });

    it('customDate: income ends at specified date', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: { start: { type: 'now' }, end: { type: 'customDate', year: 2030, month: 12 } },
        })
      );

      // Before December 2030
      let simState = createSimulationState({ time: { age: 41, year: 2030, month: 11, date: new Date(2030, 10, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);

      // At December 2030
      simState = createSimulationState({ time: { age: 41, year: 2030.916, month: 12, date: new Date(2030, 11, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);

      // After December 2030
      simState = createSimulationState({ time: { age: 42, year: 2031, month: 1, date: new Date(2031, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(false);
    });

    it('atRetirement: income ends when retirement phase begins', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: { start: { type: 'now' }, end: { type: 'atRetirement' } },
        })
      );

      // Pre-retirement phase
      let simState = createSimulationState({
        phase: { name: 'accumulation' } as SimulationState['phase'],
      });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);

      // Retirement phase
      simState = createSimulationState({
        phase: { name: 'retirement' } as SimulationState['phase'],
      });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(false);
    });
  });

  describe('Timeframe Boundary Conditions', () => {
    it('income with start age 30 and end age 65 is only active within range', () => {
      const income = new Income(
        createIncomeInput({
          timeframe: {
            start: { type: 'customAge', age: 30 },
            end: { type: 'customAge', age: 65 },
          },
        })
      );

      // Before range
      let simState = createSimulationState({ time: { age: 29, year: 2018, month: 1, date: new Date(2018, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(false);

      // Within range
      simState = createSimulationState({ time: { age: 45, year: 2034, month: 1, date: new Date(2034, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(true);

      // After range
      simState = createSimulationState({ time: { age: 66, year: 2055, month: 1, date: new Date(2055, 0, 1) } });
      expect(income.getIsActiveByTimeFrame(simState)).toBe(false);
    });
  });
});

describe('Income Growth Rate Tests', () => {
  it('applies growth rate annually (year change)', () => {
    const income = new Income(
      createIncomeInput({
        amount: 10000, // $10k/month = $120k/year
        frequency: 'monthly',
        growth: { growthRate: 3, growthLimit: undefined }, // 3% annual growth
      })
    );

    // First call of year 1 - growth is applied (since lastYear starts at 0)
    const year1Result = income.processMonthlyAmount(2024);
    expect(year1Result.income).toBeCloseTo(10000 * 1.03);

    // Still year 1 (no additional growth)
    const year1Result2 = income.processMonthlyAmount(2024.5);
    expect(year1Result2.income).toBeCloseTo(10000 * 1.03);

    // Year 2 - growth applied again
    const year2Result = income.processMonthlyAmount(2025);
    expect(year2Result.income).toBeCloseTo(10000 * 1.03 * 1.03);
  });

  it('compounds growth over multiple years', () => {
    const income = new Income(
      createIncomeInput({
        amount: 10000,
        frequency: 'monthly',
        growth: { growthRate: 5, growthLimit: undefined }, // 5% annual growth
      })
    );

    // Year 1 (growth applied on first call since lastYear starts at 0)
    income.processMonthlyAmount(2024);

    // Year 2 (5% additional growth)
    income.processMonthlyAmount(2025);

    // Year 3 (another 5% on top of year 2)
    // Total: 3 years of growth compounded
    const year3Result = income.processMonthlyAmount(2026);
    expect(year3Result.income).toBeCloseTo(10000 * 1.05 * 1.05 * 1.05);
  });

  it('respects upper growth limit with positive growth', () => {
    const income = new Income(
      createIncomeInput({
        amount: 10000,
        frequency: 'monthly',
        growth: { growthRate: 50, growthLimit: 130000 }, // 50% annual growth, max $130k/year
      })
    );

    // Year 1: $120k annual ($10k/month)
    income.processMonthlyAmount(2024);

    // Year 2: Would be $180k but capped at $130k
    const year2Result = income.processMonthlyAmount(2025);
    // Monthly amount should be capped at 130k/12
    expect(year2Result.income).toBeCloseTo(130000 / 12);
  });

  it('respects lower growth limit with negative growth', () => {
    const income = new Income(
      createIncomeInput({
        amount: 10000,
        frequency: 'monthly',
        growth: { growthRate: -50, growthLimit: 60000 }, // -50% annual, min $60k/year
      })
    );

    // Year 1: $120k annual
    income.processMonthlyAmount(2024);

    // Year 2: Would be $60k but growth limit (floor) is $60k
    const year2Result = income.processMonthlyAmount(2025);
    expect(year2Result.income).toBeCloseTo(60000 / 12);
  });

  it('handles zero growth correctly', () => {
    const income = new Income(
      createIncomeInput({
        amount: 10000,
        frequency: 'monthly',
        growth: { growthRate: 0, growthLimit: undefined },
      })
    );

    income.processMonthlyAmount(2024);
    const year2Result = income.processMonthlyAmount(2025);
    const year3Result = income.processMonthlyAmount(2026);

    expect(year2Result.income).toBeCloseTo(10000);
    expect(year3Result.income).toBeCloseTo(10000);
  });

  it('handles no growth config', () => {
    const income = new Income(
      createIncomeInput({
        amount: 5000,
        frequency: 'monthly',
        growth: undefined,
      })
    );

    income.processMonthlyAmount(2024);
    const year2Result = income.processMonthlyAmount(2025);
    const year5Result = income.processMonthlyAmount(2028);

    expect(year2Result.income).toBeCloseTo(5000);
    expect(year5Result.income).toBeCloseTo(5000);
  });
});

describe('Income Type Tax Handling', () => {
  it('wage income: applies withholding and FICA', () => {
    const income = new Income(
      createIncomeInput({
        amount: 10000,
        frequency: 'monthly',
        taxes: { incomeType: 'wage', withholding: 22 }, // 22% withholding
      })
    );

    const result = income.processMonthlyAmount(2024);

    expect(result.income).toBe(10000);
    expect(result.amountWithheld).toBeCloseTo(2200); // 22% of $10k
    expect(result.ficaTax).toBeCloseTo(765); // 7.65% FICA
    expect(result.incomeAfterPayrollDeductions).toBeCloseTo(10000 - 2200 - 765);
    expect(result.taxExemptIncome).toBe(0);
    expect(result.socialSecurityIncome).toBe(0);
  });

  it('social security income: applies withholding, tracks as SS income', () => {
    const income = new Income(
      createIncomeInput({
        amount: 2500,
        frequency: 'monthly',
        taxes: { incomeType: 'socialSecurity', withholding: 10 }, // 10% voluntary withholding
      })
    );

    const result = income.processMonthlyAmount(2024);

    expect(result.income).toBe(2500);
    expect(result.amountWithheld).toBeCloseTo(250); // 10%
    expect(result.ficaTax).toBe(0); // No FICA on SS
    expect(result.socialSecurityIncome).toBe(2500); // Tracked for provisional income
    expect(result.taxExemptIncome).toBe(0);
  });

  it('exempt income: no taxes, tracked as tax-exempt', () => {
    const income = new Income(
      createIncomeInput({
        amount: 3000,
        frequency: 'monthly',
        taxes: { incomeType: 'exempt' },
      })
    );

    const result = income.processMonthlyAmount(2024);

    expect(result.income).toBe(3000);
    expect(result.amountWithheld).toBe(0);
    expect(result.ficaTax).toBe(0);
    expect(result.taxExemptIncome).toBe(3000);
    expect(result.socialSecurityIncome).toBe(0);
    expect(result.incomeAfterPayrollDeductions).toBe(3000);
  });

  it('pension income: standard income (no special handling)', () => {
    const income = new Income(
      createIncomeInput({
        amount: 4000,
        frequency: 'monthly',
        taxes: { incomeType: 'pension' },
      })
    );

    const result = income.processMonthlyAmount(2024);

    expect(result.income).toBe(4000);
    expect(result.amountWithheld).toBe(0);
    expect(result.ficaTax).toBe(0);
    expect(result.incomeAfterPayrollDeductions).toBe(4000);
  });
});

describe('Income Frequency Tests', () => {
  it('monthly: processes full amount each month', () => {
    const income = new Income(
      createIncomeInput({
        amount: 10000,
        frequency: 'monthly',
      })
    );

    const result = income.processMonthlyAmount(2024);
    expect(result.income).toBeCloseTo(10000);
  });

  it('yearly: distributes amount across 12 months', () => {
    const income = new Income(
      createIncomeInput({
        amount: 120000, // Annual amount
        frequency: 'yearly',
      })
    );

    const result = income.processMonthlyAmount(2024);
    // yearly / 12 months
    expect(result.income).toBeCloseTo(10000);
  });

  it('quarterly: distributes quarterly amount across months', () => {
    const income = new Income(
      createIncomeInput({
        amount: 30000, // Per quarter
        frequency: 'quarterly',
      })
    );

    const result = income.processMonthlyAmount(2024);
    // 4 quarters per year * $30k = $120k annual / 12 = $10k per month
    expect(result.income).toBeCloseTo(10000);
  });

  it('biweekly: distributes biweekly amount across months', () => {
    const income = new Income(
      createIncomeInput({
        amount: 4615.38, // Per biweekly period (~$120k annual / 26)
        frequency: 'biweekly',
      })
    );

    const result = income.processMonthlyAmount(2024);
    // 26 periods * $4615.38 / 12 months
    expect(result.income).toBeCloseTo(10000, 0);
  });

  it('weekly: distributes weekly amount across months', () => {
    const income = new Income(
      createIncomeInput({
        amount: 2307.69, // Per week (~$120k annual / 52)
        frequency: 'weekly',
      })
    );

    const result = income.processMonthlyAmount(2024);
    // 52 weeks * $2307.69 / 12 months
    expect(result.income).toBeCloseTo(10000, 0);
  });

  it('oneTime: processes once and then returns zero', () => {
    const income = new Income(
      createIncomeInput({
        amount: 50000, // One-time bonus
        frequency: 'oneTime',
      })
    );

    // First month - full amount
    const result1 = income.processMonthlyAmount(2024);
    expect(result1.income).toBe(50000);

    // Second month - zero (already occurred)
    const result2 = income.processMonthlyAmount(2024.083);
    expect(result2.income).toBe(0);

    // Later month - still zero
    const result3 = income.processMonthlyAmount(2025);
    expect(result3.income).toBe(0);
  });
});

describe('Incomes Collection Tests', () => {
  it('filters active incomes by timeframe', () => {
    const incomes = new Incomes([
      createIncomeInput({
        id: 'active',
        name: 'Active Income',
        timeframe: { start: { type: 'now' }, end: undefined },
      }),
      createIncomeInput({
        id: 'future',
        name: 'Future Income',
        timeframe: { start: { type: 'customAge', age: 65 }, end: undefined },
      }),
      createIncomeInput({
        id: 'past',
        name: 'Past Income',
        timeframe: { start: { type: 'now' }, end: { type: 'customAge', age: 30 } },
      }),
    ]);

    const simState = createSimulationState({ time: { age: 35, year: 2024, month: 1, date: new Date(2024, 0, 1) } });
    const activeIncomes = incomes.getActiveIncomesByTimeFrame(simState);

    expect(activeIncomes.length).toBe(1);
    expect(activeIncomes[0].processMonthlyAmount(2024).name).toBe('Active Income');
  });

  it('excludes disabled incomes', () => {
    const incomes = new Incomes([
      createIncomeInput({ id: 'enabled', name: 'Enabled', disabled: false }),
      createIncomeInput({ id: 'disabled', name: 'Disabled', disabled: true }),
    ]);

    const simState = createSimulationState();
    const activeIncomes = incomes.getActiveIncomesByTimeFrame(simState);

    expect(activeIncomes.length).toBe(1);
    expect(activeIncomes[0].processMonthlyAmount(2024).name).toBe('Enabled');
  });
});

describe('IncomesProcessor Tests', () => {
  it('aggregates multiple incomes correctly', () => {
    const incomes = new Incomes([
      createIncomeInput({
        id: 'salary',
        name: 'Salary',
        amount: 10000,
        frequency: 'monthly',
        taxes: { incomeType: 'wage', withholding: 22 },
      }),
      createIncomeInput({
        id: 'side-gig',
        name: 'Side Gig',
        amount: 2000,
        frequency: 'monthly',
        taxes: { incomeType: 'selfEmployment' },
      }),
    ]);

    const simState = createSimulationState();
    const processor = new IncomesProcessor(simState, incomes);
    const result = processor.process();

    expect(result.totalIncome).toBeCloseTo(12000);
    expect(Object.keys(result.perIncomeData).length).toBe(2);
    expect(result.perIncomeData['salary'].income).toBeCloseTo(10000);
    expect(result.perIncomeData['side-gig'].income).toBeCloseTo(2000);
  });

  it('tracks Social Security income separately for provisional income', () => {
    const incomes = new Incomes([
      createIncomeInput({
        id: 'pension',
        name: 'Pension',
        amount: 3000,
        frequency: 'monthly',
        taxes: { incomeType: 'pension' },
      }),
      createIncomeInput({
        id: 'ss',
        name: 'Social Security',
        amount: 2500,
        frequency: 'monthly',
        taxes: { incomeType: 'socialSecurity', withholding: 0 },
      }),
    ]);

    const simState = createSimulationState();
    const processor = new IncomesProcessor(simState, incomes);
    const result = processor.process();

    expect(result.totalIncome).toBeCloseTo(5500);
    expect(result.totalSocialSecurityIncome).toBeCloseTo(2500);
  });

  it('annual data sums monthly data correctly', () => {
    const incomes = new Incomes([
      createIncomeInput({
        id: 'salary',
        name: 'Salary',
        amount: 10000,
        frequency: 'monthly',
        taxes: { incomeType: 'wage', withholding: 22 },
      }),
    ]);

    const simState = createSimulationState();
    const processor = new IncomesProcessor(simState, incomes);

    // Process 12 months
    for (let month = 0; month < 12; month++) {
      processor.process();
    }

    const annualData = processor.getAnnualData();
    expect(annualData.totalIncome).toBeCloseTo(120000);
    expect(annualData.totalAmountWithheld).toBeCloseTo(26400); // 22% of $120k
    expect(annualData.totalFicaTax).toBeCloseTo(9180); // 7.65% of $120k
  });
});
