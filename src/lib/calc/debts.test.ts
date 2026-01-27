import { describe, it, expect } from 'vitest';

import type { DebtInputs } from '@/lib/schemas/inputs/debt-form-schema';

import { Debt, Debts, DebtsProcessor } from './debts';
import type { SimulationState } from './simulation-engine';

/**
 * Debts Tests
 *
 * Tests for:
 * - Interest calculations (simple, compound monthly, compound daily)
 * - Payment processing (principal reduction, interest-only, negative amortization)
 * - Activation/scheduling (timeframe handling)
 * - Collection operations (filtering, aggregation)
 * - Processor operations (process, annual data, reset)
 */

// ============================================================================
// Helper Functions
// ============================================================================

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

const createDebtInput = (overrides?: Partial<DebtInputs>): DebtInputs => ({
  id: overrides?.id ?? 'debt-1',
  name: overrides?.name ?? 'Credit Card',
  balance: overrides?.balance ?? 10000,
  apr: overrides?.apr ?? 18,
  interestType: overrides?.interestType ?? 'simple',
  compoundingFrequency: overrides?.compoundingFrequency,
  startDate: overrides?.startDate ?? { type: 'now' },
  monthlyPayment: overrides?.monthlyPayment ?? 500,
  disabled: overrides?.disabled ?? false,
});

// ============================================================================
// Debt Class Tests
// ============================================================================

describe('Debt Class', () => {
  describe('Interest Calculation Tests', () => {
    it('calculates simple interest: balance * (apr / 12)', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 18, // 18% APR
          interestType: 'simple',
        })
      );

      // Formula: balance * (apr / 12) = 10000 * (0.18 / 12) = 150
      const { interestForPeriod } = debt.getMonthlyPaymentInfo();

      expect(interestForPeriod).toBeCloseTo(150);
    });

    it('calculates compound interest (monthly): balance * ((1 + apr/12)^1 - 1)', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 18, // 18% APR
          interestType: 'compound',
          compoundingFrequency: 'monthly',
        })
      );

      // For monthly compounding, periodsPerYear = 12, periodsPerMonth = 1
      // Formula: balance * ((1 + apr/periodsPerYear)^periodsPerMonth - 1)
      // = 10000 * ((1 + 0.18/12)^1 - 1) = 10000 * (0.015) = 150
      const expectedInterest = 10000 * (Math.pow(1 + 0.18 / 12, 1) - 1);
      const { interestForPeriod } = debt.getMonthlyPaymentInfo();

      expect(interestForPeriod).toBeCloseTo(expectedInterest);
    });

    it('calculates compound interest (daily): balance * ((1 + apr/365)^(365/12) - 1)', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 18, // 18% APR
          interestType: 'compound',
          compoundingFrequency: 'daily',
        })
      );

      // For daily compounding, periodsPerYear = 365, periodsPerMonth = 365/12
      // Formula: balance * ((1 + apr/periodsPerYear)^periodsPerMonth - 1)
      const periodsPerMonth = 365 / 12;
      const expectedInterest = 10000 * (Math.pow(1 + 0.18 / 365, periodsPerMonth) - 1);
      const { interestForPeriod } = debt.getMonthlyPaymentInfo();

      expect(interestForPeriod).toBeCloseTo(expectedInterest);
    });

    it('zero APR returns 0 interest', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 0,
          interestType: 'simple',
        })
      );

      const { interestForPeriod } = debt.getMonthlyPaymentInfo();

      expect(interestForPeriod).toBe(0);
    });
  });

  describe('Payment Tests', () => {
    it('payment > interest reduces principal', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 18,
          monthlyPayment: 500,
          interestType: 'simple',
        })
      );

      const initialBalance = debt.getBalance();
      const { monthlyPaymentDue, interestForPeriod } = debt.getMonthlyPaymentInfo();

      // Payment = 500, Interest = 150, Principal = 350
      debt.applyPayment(monthlyPaymentDue, interestForPeriod);

      const expectedBalance = initialBalance - (monthlyPaymentDue - interestForPeriod);
      expect(debt.getBalance()).toBeCloseTo(expectedBalance);
      expect(debt.getBalance()).toBeCloseTo(10000 - 350);
    });

    it('payment = interest (interest-only scenario)', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 18,
          monthlyPayment: 150, // Exactly matches interest
          interestType: 'simple',
        })
      );

      const initialBalance = debt.getBalance();
      const { monthlyPaymentDue, interestForPeriod } = debt.getMonthlyPaymentInfo();

      // Interest = 150, payment = 150, principal = 0
      expect(monthlyPaymentDue).toBeCloseTo(interestForPeriod);

      debt.applyPayment(monthlyPaymentDue, interestForPeriod);

      // Balance should remain unchanged
      expect(debt.getBalance()).toBeCloseTo(initialBalance);
    });

    it('payment < interest increases balance (negative amortization)', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 18,
          monthlyPayment: 100, // Less than interest
          interestType: 'simple',
        })
      );

      const initialBalance = debt.getBalance();
      const { monthlyPaymentDue, interestForPeriod } = debt.getMonthlyPaymentInfo();

      // Interest = 150, payment = 100, unpaid interest = 50
      expect(interestForPeriod).toBeCloseTo(150);
      expect(monthlyPaymentDue).toBe(100);

      debt.applyPayment(monthlyPaymentDue, interestForPeriod);

      // Balance should increase by unpaid interest
      const expectedBalance = initialBalance + (interestForPeriod - monthlyPaymentDue);
      expect(debt.getBalance()).toBeCloseTo(expectedBalance);
      expect(debt.getBalance()).toBeCloseTo(10050);
    });

    it('final payment handles exact payoff', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 1000,
          apr: 0, // Zero APR for simplicity
          monthlyPayment: 100,
          interestType: 'simple',
        })
      );

      // Pay off the loan in 10 payments
      for (let i = 0; i < 10; i++) {
        const { monthlyPaymentDue, interestForPeriod } = debt.getMonthlyPaymentInfo();
        debt.applyPayment(monthlyPaymentDue, interestForPeriod);
      }

      expect(debt.getBalance()).toBe(0);
      expect(debt.isPaidOff()).toBe(true);
    });

    it('paid off debt returns 0 payment', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 100,
          apr: 0,
          monthlyPayment: 200, // More than balance
          interestType: 'simple',
        })
      );

      // First payment pays it off
      const firstPayment = debt.getMonthlyPaymentInfo();
      expect(firstPayment.monthlyPaymentDue).toBe(100); // Capped at balance
      debt.applyPayment(firstPayment.monthlyPaymentDue, firstPayment.interestForPeriod);

      expect(debt.isPaidOff()).toBe(true);

      // Second call should return 0
      const secondPayment = debt.getMonthlyPaymentInfo();
      expect(secondPayment.monthlyPaymentDue).toBe(0);
    });
  });

  describe('Activation Tests (getIsActive)', () => {
    it('now - active immediately', () => {
      const debt = new Debt(
        createDebtInput({
          startDate: { type: 'now' },
        })
      );

      const simState = createSimulationState();
      expect(debt.getIsActive(simState)).toBe(true);
    });

    it('customAge - active at age', () => {
      const debt = new Debt(
        createDebtInput({
          startDate: { type: 'customAge', age: 40 },
        })
      );

      // Before age 40
      let simState = createSimulationState({ time: { age: 39, year: 2028, month: 1, date: new Date(2028, 0, 1) } });
      expect(debt.getIsActive(simState)).toBe(false);

      // At age 40
      simState = createSimulationState({ time: { age: 40, year: 2029, month: 1, date: new Date(2029, 0, 1) } });
      expect(debt.getIsActive(simState)).toBe(true);

      // After age 40
      simState = createSimulationState({ time: { age: 45, year: 2034, month: 1, date: new Date(2034, 0, 1) } });
      expect(debt.getIsActive(simState)).toBe(true);
    });

    it('customDate - active at date', () => {
      const debt = new Debt(
        createDebtInput({
          startDate: { type: 'customDate', year: 2025, month: 6 },
        })
      );

      // Before June 2025
      let simState = createSimulationState({ time: { age: 36, year: 2025, month: 5, date: new Date(2025, 4, 1) } });
      expect(debt.getIsActive(simState)).toBe(false);

      // At June 2025
      simState = createSimulationState({ time: { age: 36, year: 2025, month: 6, date: new Date(2025, 5, 1) } });
      expect(debt.getIsActive(simState)).toBe(true);
    });

    it('atRetirement - active in retirement', () => {
      const debt = new Debt(
        createDebtInput({
          startDate: { type: 'atRetirement' },
        })
      );

      // Pre-retirement
      let simState = createSimulationState({ phase: { name: 'accumulation' } });
      expect(debt.getIsActive(simState)).toBe(false);

      // In retirement
      simState = createSimulationState({ phase: { name: 'retirement' } });
      expect(debt.getIsActive(simState)).toBe(true);
    });

    it('atLifeExpectancy - never active', () => {
      const debt = new Debt(
        createDebtInput({
          startDate: { type: 'atLifeExpectancy' },
        })
      );

      // Should never be active
      const simState = createSimulationState({ time: { age: 100, year: 2089, month: 1, date: new Date(2089, 0, 1) } });
      expect(debt.getIsActive(simState)).toBe(false);
    });

    it('paid off debt is never active', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 100,
          apr: 0,
          monthlyPayment: 200,
          startDate: { type: 'now' },
        })
      );

      const simState = createSimulationState();

      // Before payoff - active
      expect(debt.getIsActive(simState)).toBe(true);

      // Pay off
      const { monthlyPaymentDue, interestForPeriod } = debt.getMonthlyPaymentInfo();
      debt.applyPayment(monthlyPaymentDue, interestForPeriod);

      // After payoff - not active
      expect(debt.getIsActive(simState)).toBe(false);
    });
  });
});

// ============================================================================
// Debts Collection Tests
// ============================================================================

describe('Debts Collection', () => {
  it('filters disabled debts', () => {
    const debts = new Debts([
      createDebtInput({ id: 'enabled', name: 'Enabled', disabled: false }),
      createDebtInput({ id: 'disabled', name: 'Disabled', disabled: true }),
    ]);

    const simState = createSimulationState();
    const activeDebts = debts.getActiveDebts(simState);

    expect(activeDebts.length).toBe(1);
    expect(activeDebts[0].getName()).toBe('Enabled');
  });

  it('getActiveDebts filters by timepoint', () => {
    const debts = new Debts([
      createDebtInput({
        id: 'current',
        name: 'Current Debt',
        startDate: { type: 'now' },
      }),
      createDebtInput({
        id: 'future',
        name: 'Future Debt',
        startDate: { type: 'customAge', age: 50 },
      }),
    ]);

    const simState = createSimulationState({ time: { age: 35, year: 2024, month: 1, date: new Date(2024, 0, 1) } });
    const activeDebts = debts.getActiveDebts(simState);

    expect(activeDebts.length).toBe(1);
    expect(activeDebts[0].getName()).toBe('Current Debt');
  });

  it('getTotalBalance aggregates all debt balances', () => {
    const debts = new Debts([
      createDebtInput({ id: 'debt1', balance: 10000 }),
      createDebtInput({ id: 'debt2', balance: 5000 }),
      createDebtInput({ id: 'debt3', balance: 15000 }),
    ]);

    expect(debts.getTotalBalance()).toBe(30000);
  });

  it('getTotalBalance excludes disabled debts', () => {
    const debts = new Debts([
      createDebtInput({ id: 'enabled1', balance: 10000, disabled: false }),
      createDebtInput({ id: 'disabled', balance: 50000, disabled: true }),
      createDebtInput({ id: 'enabled2', balance: 5000, disabled: false }),
    ]);

    expect(debts.getTotalBalance()).toBe(15000);
  });
});

// ============================================================================
// DebtsProcessor Tests
// ============================================================================

describe('DebtsProcessor', () => {
  it('process() calculates payments and updates balances', () => {
    const debts = new Debts([
      createDebtInput({
        id: 'card',
        name: 'Credit Card',
        balance: 10000,
        apr: 18,
        monthlyPayment: 500,
        interestType: 'simple',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new DebtsProcessor(simState, debts);

    const result = processor.process();

    // Interest = 10000 * 0.18 / 12 = 150
    // Principal = 500 - 150 = 350
    expect(result.totalInterestForPeriod).toBeCloseTo(150);
    expect(result.totalPaymentForPeriod).toBe(500);
    expect(result.totalPrincipalPaidForPeriod).toBeCloseTo(350);
    expect(result.perDebtData['card']).toBeDefined();
    expect(result.perDebtData['card'].balance).toBeCloseTo(9650);
  });

  it('process() handles multiple debts', () => {
    const debts = new Debts([
      createDebtInput({
        id: 'card1',
        name: 'Card 1',
        balance: 5000,
        apr: 20,
        monthlyPayment: 200,
        interestType: 'simple',
      }),
      createDebtInput({
        id: 'card2',
        name: 'Card 2',
        balance: 8000,
        apr: 15,
        monthlyPayment: 300,
        interestType: 'simple',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new DebtsProcessor(simState, debts);

    const result = processor.process();

    // Card 1: interest = 5000 * 0.20 / 12 = 83.33
    // Card 2: interest = 8000 * 0.15 / 12 = 100
    // Total interest = 183.33
    // Total payment = 500
    expect(result.totalInterestForPeriod).toBeCloseTo(183.33, 1);
    expect(result.totalPaymentForPeriod).toBe(500);
    expect(result.perDebtData['card1']).toBeDefined();
    expect(result.perDebtData['card2']).toBeDefined();
  });

  it('getAnnualData() aggregates 12 months', () => {
    const debts = new Debts([
      createDebtInput({
        id: 'loan',
        name: 'Personal Loan',
        balance: 10000,
        apr: 0, // Zero APR for predictable payoff
        monthlyPayment: 1000,
        interestType: 'simple',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new DebtsProcessor(simState, debts);

    // Process 12 months - loan pays off in 10 months
    for (let i = 0; i < 12; i++) {
      processor.process();
    }

    const annualData = processor.getAnnualData();

    // Total payments should be 10 * 1000 = 10000 (paid off in 10 months)
    expect(annualData.totalPaymentForPeriod).toBe(10000);
    expect(annualData.totalInterestForPeriod).toBe(0);
    expect(annualData.totalPrincipalPaidForPeriod).toBe(10000);

    // Final balance should be 0
    expect(annualData.totalDebtBalance).toBe(0);
  });

  it('resetMonthlyData() clears accumulated data', () => {
    const debts = new Debts([
      createDebtInput({
        id: 'debt',
        balance: 10000,
        apr: 12,
        monthlyPayment: 500,
      }),
    ]);

    const simState = createSimulationState();
    const processor = new DebtsProcessor(simState, debts);

    // Process some months
    processor.process();
    processor.process();
    processor.process();

    let annualData = processor.getAnnualData();
    expect(annualData.totalPaymentForPeriod).toBeGreaterThan(0);

    // Reset
    processor.resetMonthlyData();

    annualData = processor.getAnnualData();
    expect(annualData.totalPaymentForPeriod).toBe(0);
    expect(annualData.totalInterestForPeriod).toBe(0);
    expect(annualData.totalPrincipalPaidForPeriod).toBe(0);
  });

  it('process() handles debt that becomes paid off mid-simulation', () => {
    const debts = new Debts([
      createDebtInput({
        id: 'small-debt',
        balance: 1000,
        apr: 0, // Zero interest for simplicity
        monthlyPayment: 400,
      }),
    ]);

    const simState = createSimulationState();
    const processor = new DebtsProcessor(simState, debts);

    // Month 1: payment 400, balance 600
    let result = processor.process();
    expect(result.totalDebtBalance).toBe(600);
    expect(result.perDebtData['small-debt'].isPaidOff).toBe(false);

    // Month 2: payment 400, balance 200
    result = processor.process();
    expect(result.totalDebtBalance).toBe(200);
    expect(result.perDebtData['small-debt'].isPaidOff).toBe(false);

    // Month 3: payment 200 (final), balance 0
    result = processor.process();
    expect(result.totalDebtBalance).toBe(0);
    expect(result.perDebtData['small-debt'].isPaidOff).toBe(true);

    // Month 4: no more payments
    result = processor.process();
    expect(result.totalPaymentForPeriod).toBe(0);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('very high APR (payday loan scenario)', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 500,
        apr: 400, // 400% APR (typical payday loan)
        monthlyPayment: 100,
        interestType: 'simple',
      })
    );

    // Interest = 500 * 4.00 / 12 = 166.67
    const { interestForPeriod, monthlyPaymentDue } = debt.getMonthlyPaymentInfo();

    expect(interestForPeriod).toBeCloseTo(166.67, 1);
    expect(monthlyPaymentDue).toBe(100); // Capped at payment amount

    // Payment < interest, so balance should increase
    debt.applyPayment(monthlyPaymentDue, interestForPeriod);
    expect(debt.getBalance()).toBeGreaterThan(500);
    expect(debt.getBalance()).toBeCloseTo(566.67, 1);
  });

  it('compound interest without frequency throws error', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 18,
        interestType: 'compound',
        compoundingFrequency: undefined, // Missing!
      })
    );

    expect(() => debt.getMonthlyPaymentInfo()).toThrow('Missing compoundingFrequency');
  });

  it('very small balance is paid off cleanly', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 0.01, // 1 cent
        apr: 18,
        monthlyPayment: 500,
        interestType: 'simple',
      })
    );

    const { monthlyPaymentDue, interestForPeriod } = debt.getMonthlyPaymentInfo();

    // Payment should be capped at balance + interest
    expect(monthlyPaymentDue).toBeLessThan(1);

    debt.applyPayment(monthlyPaymentDue, interestForPeriod);
    expect(debt.getBalance()).toBe(0);
  });

  it('multiple debts with different start dates', () => {
    const debts = new Debts([
      createDebtInput({
        id: 'now',
        name: 'Current Debt',
        balance: 5000,
        startDate: { type: 'now' },
      }),
      createDebtInput({
        id: 'retirement',
        name: 'Retirement Debt',
        balance: 10000,
        startDate: { type: 'atRetirement' },
      }),
    ]);

    // In accumulation phase
    let simState = createSimulationState({ phase: { name: 'accumulation' } });
    let activeDebts = debts.getActiveDebts(simState);
    expect(activeDebts.length).toBe(1);
    expect(activeDebts[0].getName()).toBe('Current Debt');

    // In retirement
    simState = createSimulationState({ phase: { name: 'retirement' } });
    activeDebts = debts.getActiveDebts(simState);
    expect(activeDebts.length).toBe(2);
  });

  it('compound daily interest is higher than compound monthly', () => {
    const dailyDebt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 18,
        interestType: 'compound',
        compoundingFrequency: 'daily',
      })
    );

    const monthlyDebt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 18,
        interestType: 'compound',
        compoundingFrequency: 'monthly',
      })
    );

    const dailyInterest = dailyDebt.getMonthlyPaymentInfo().interestForPeriod;
    const monthlyInterest = monthlyDebt.getMonthlyPaymentInfo().interestForPeriod;

    // Daily compounding should yield slightly higher interest
    expect(dailyInterest).toBeGreaterThan(monthlyInterest);
  });

  it('simple interest equals monthly compound interest', () => {
    const simpleDebt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 18,
        interestType: 'simple',
      })
    );

    const compoundDebt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 18,
        interestType: 'compound',
        compoundingFrequency: 'monthly',
      })
    );

    const simpleInterest = simpleDebt.getMonthlyPaymentInfo().interestForPeriod;
    const compoundInterest = compoundDebt.getMonthlyPaymentInfo().interestForPeriod;

    // For monthly compounding, the formulas are equivalent
    expect(simpleInterest).toBeCloseTo(compoundInterest);
  });
});
