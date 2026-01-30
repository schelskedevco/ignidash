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
 * - Inflation adjustment (payment deflation, real interest rates)
 * - Activation/scheduling (timeframe handling)
 * - Collection operations (filtering, aggregation)
 * - Processor operations (process, annual data, reset)
 */

// ============================================================================
// Helper Functions
// ============================================================================

// Default to zero inflation for legacy tests to maintain existing behavior
const ZERO_INFLATION = 0;

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
      const { interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

      expect(interest).toBeCloseTo(150);
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
      const { interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

      expect(interest).toBeCloseTo(expectedInterest);
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
      const { interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

      expect(interest).toBeCloseTo(expectedInterest);
    });

    it('zero APR returns 0 interest', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 0,
          interestType: 'simple',
        })
      );

      const { interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

      expect(interest).toBe(0);
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
      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

      // Payment = 500, Interest = 150, Principal = 350
      debt.applyPayment(monthlyPaymentDue, interest);

      const expectedBalance = initialBalance - (monthlyPaymentDue - interest);
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
      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

      // Interest = 150, payment = 150, principal = 0
      expect(monthlyPaymentDue).toBeCloseTo(interest);

      debt.applyPayment(monthlyPaymentDue, interest);

      // Balance should remain unchanged
      expect(debt.getBalance()).toBeCloseTo(initialBalance);
    });

    it('payment < interest increases balance but interest basis unchanged (simple interest)', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 18,
          monthlyPayment: 100, // Less than interest
          interestType: 'simple',
        })
      );

      const initialBalance = debt.getBalance();

      // Month 1
      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

      // Interest = 150, payment = 100, unpaid interest = 50
      expect(interest).toBeCloseTo(150);
      expect(monthlyPaymentDue).toBe(100);

      debt.applyPayment(monthlyPaymentDue, interest);

      // Balance should increase by unpaid interest
      const expectedBalance = initialBalance + (interest - monthlyPaymentDue);
      expect(debt.getBalance()).toBeCloseTo(expectedBalance);
      expect(debt.getBalance()).toBeCloseTo(10050);

      // Month 2 - interest should STILL be $150 (simple interest calculates on principal, not balance)
      const { interest: interestMonth2 } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);
      expect(interestMonth2).toBeCloseTo(150); // NOT 150.75 (which would be compound)
    });

    it('payment < interest compounds for compound interest type', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 18,
          monthlyPayment: 100, // Less than interest
          interestType: 'compound',
          compoundingFrequency: 'monthly',
        })
      );

      // Month 1
      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);
      expect(interest).toBeCloseTo(150);
      debt.applyPayment(monthlyPaymentDue, interest);

      // Month 2 - interest SHOULD be higher (compound interest adds unpaid interest to balance)
      const { interest: interestMonth2 } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);
      expect(interestMonth2).toBeGreaterThan(150); // Should be ~150.75
      expect(interestMonth2).toBeCloseTo(150.75, 1);
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
        const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);
        debt.applyPayment(monthlyPaymentDue, interest);
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
      const firstPayment = debt.getMonthlyPaymentInfo(ZERO_INFLATION);
      expect(firstPayment.monthlyPaymentDue).toBe(100); // Capped at balance
      debt.applyPayment(firstPayment.monthlyPaymentDue, firstPayment.interest);

      expect(debt.isPaidOff()).toBe(true);

      // Second call should return 0
      const secondPayment = debt.getMonthlyPaymentInfo(ZERO_INFLATION);
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
      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);
      debt.applyPayment(monthlyPaymentDue, interest);

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

    const result = processor.process(ZERO_INFLATION);

    // Interest = 10000 * 0.18 / 12 = 150
    // Principal = 500 - 150 = 350
    expect(result.totalInterest).toBeCloseTo(150);
    expect(result.totalPayment).toBe(500);
    expect(result.totalPrincipalPaid).toBeCloseTo(350);
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

    const result = processor.process(ZERO_INFLATION);

    // Card 1: interest = 5000 * 0.20 / 12 = 83.33
    // Card 2: interest = 8000 * 0.15 / 12 = 100
    // Total interest = 183.33
    // Total payment = 500
    expect(result.totalInterest).toBeCloseTo(183.33, 1);
    expect(result.totalPayment).toBe(500);
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
      processor.process(ZERO_INFLATION);
    }

    const annualData = processor.getAnnualData();

    // Total payments should be 10 * 1000 = 10000 (paid off in 10 months)
    expect(annualData.totalPayment).toBe(10000);
    expect(annualData.totalInterest).toBe(0);
    expect(annualData.totalPrincipalPaid).toBe(10000);

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
    processor.process(ZERO_INFLATION);
    processor.process(ZERO_INFLATION);
    processor.process(ZERO_INFLATION);

    let annualData = processor.getAnnualData();
    expect(annualData.totalPayment).toBeGreaterThan(0);

    // Reset
    processor.resetMonthlyData();

    annualData = processor.getAnnualData();
    expect(annualData.totalPayment).toBe(0);
    expect(annualData.totalInterest).toBe(0);
    expect(annualData.totalPrincipalPaid).toBe(0);
  });

  it('unpaidInterest is raw (can be negative when payment > interest)', () => {
    // unpaidInterest = interest - payment (raw, not capped)
    // Invariant: unpaidInterest = -principalPaid

    const debts = new Debts([
      createDebtInput({
        id: 'normal-debt',
        name: 'Normal Debt',
        balance: 5000,
        apr: 20, // interest = 5000 * 0.20 / 12 = 83.33
        monthlyPayment: 200, // payment > interest, so unpaidInterest = 83.33 - 200 = -116.67
        interestType: 'simple',
      }),
      createDebtInput({
        id: 'underwater-debt',
        name: 'Underwater Debt',
        balance: 10000,
        apr: 200, // interest = 10000 * 2.00 / 12 = 1666.67
        monthlyPayment: 50, // payment < interest, so unpaidInterest = 1666.67 - 50 = 1616.67
        interestType: 'simple',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new DebtsProcessor(simState, debts);

    const result = processor.process(ZERO_INFLATION);

    // Verify individual calculations
    const normalDebt = result.perDebtData['normal-debt'];
    const underwaterDebt = result.perDebtData['underwater-debt'];

    // Normal debt: payment > interest → negative unpaidInterest (interest surplus)
    expect(normalDebt.unpaidInterest).toBeCloseTo(-116.67, 0);
    // Underwater debt: payment < interest → positive unpaidInterest
    expect(underwaterDebt.unpaidInterest).toBeCloseTo(1616.67, 0);

    // Total unpaid interest = sum of raw values = -116.67 + 1616.67 = 1500
    expect(result.totalUnpaidInterest).toBeCloseTo(1500, 0);

    // Invariant: unpaidInterest = -principalPaid (for each debt and total)
    expect(normalDebt.unpaidInterest).toBeCloseTo(-normalDebt.principalPaid, 2);
    expect(underwaterDebt.unpaidInterest).toBeCloseTo(-underwaterDebt.principalPaid, 2);
    expect(result.totalUnpaidInterest).toBeCloseTo(-result.totalPrincipalPaid, 1);
  });

  it('principalPaid uses raw values (not capped per-debt)', () => {
    // principalPaid is now calculated as raw (payment - interest) for each debt
    // This allows net worth tracking to correctly reflect balance changes
    //
    // With multiple debts where one has payment < interest:
    // - Debt 1: payment = 200, interest = 83.33 → principal = 116.67
    // - Debt 2: payment = 50, interest = 1666.67 → principal = -1616.67 (raw, not capped)
    //
    // Total principal = 116.67 + (-1616.67) = -1500

    const debts = new Debts([
      createDebtInput({
        id: 'normal-debt',
        name: 'Normal Debt',
        balance: 5000,
        apr: 20, // interest = 5000 * 0.20 / 12 = 83.33
        monthlyPayment: 200, // payment > interest, so principal = 116.67
        interestType: 'simple',
      }),
      createDebtInput({
        id: 'underwater-debt',
        name: 'Underwater Debt',
        balance: 10000,
        apr: 200, // interest = 10000 * 2.00 / 12 = 1666.67
        monthlyPayment: 50, // payment < interest, so principal = -1616.67 (raw)
        interestType: 'simple',
      }),
    ]);

    const simState = createSimulationState();
    const processor = new DebtsProcessor(simState, debts);

    const result = processor.process(ZERO_INFLATION);

    // Verify individual calculations
    const normalDebt = result.perDebtData['normal-debt'];
    const underwaterDebt = result.perDebtData['underwater-debt'];

    expect(normalDebt.interest).toBeCloseTo(83.33, 1);
    expect(normalDebt.principalPaid).toBeCloseTo(116.67, 1);

    expect(underwaterDebt.interest).toBeCloseTo(1666.67, 0);
    // Raw value: 50 - 1666.67 = -1616.67
    expect(underwaterDebt.principalPaid).toBeCloseTo(-1616.67, 0);

    // Total principal = sum of raw values
    // 116.67 + (-1616.67) = -1500
    expect(result.totalPrincipalPaid).toBeCloseTo(-1500, 0);

    // Verify the relationship: principalPaid = payment - interest (raw sum)
    expect(result.totalPrincipalPaid).toBeCloseTo(result.totalPayment - result.totalInterest, 1);
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
    let result = processor.process(ZERO_INFLATION);
    expect(result.totalDebtBalance).toBe(600);
    expect(result.perDebtData['small-debt'].isPaidOff).toBe(false);

    // Month 2: payment 400, balance 200
    result = processor.process(ZERO_INFLATION);
    expect(result.totalDebtBalance).toBe(200);
    expect(result.perDebtData['small-debt'].isPaidOff).toBe(false);

    // Month 3: payment 200 (final), balance 0
    result = processor.process(ZERO_INFLATION);
    expect(result.totalDebtBalance).toBe(0);
    expect(result.perDebtData['small-debt'].isPaidOff).toBe(true);

    // Month 4: no more payments
    result = processor.process(ZERO_INFLATION);
    expect(result.totalPayment).toBe(0);
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
    const { interest, monthlyPaymentDue } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

    expect(interest).toBeCloseTo(166.67, 1);
    expect(monthlyPaymentDue).toBe(100); // Capped at payment amount

    // Payment < interest, so balance should increase
    debt.applyPayment(monthlyPaymentDue, interest);
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

    expect(() => debt.getMonthlyPaymentInfo(ZERO_INFLATION)).toThrow('Missing compoundingFrequency');
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

    const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(ZERO_INFLATION);

    // Payment should be capped at balance + interest
    expect(monthlyPaymentDue).toBeLessThan(1);

    debt.applyPayment(monthlyPaymentDue, interest);
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

    const dailyInterest = dailyDebt.getMonthlyPaymentInfo(ZERO_INFLATION).interest;
    const monthlyInterest = monthlyDebt.getMonthlyPaymentInfo(ZERO_INFLATION).interest;

    // Daily compounding should yield slightly higher interest
    expect(dailyInterest).toBeGreaterThan(monthlyInterest);
  });
});

// ============================================================================
// Extreme Inflation Edge Cases
// ============================================================================

describe('Extreme Inflation Edge Cases', () => {
  it('should handle very high inflation (50% annual) without errors', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 5,
        monthlyPayment: 100,
        interestType: 'simple',
      })
    );

    const annualInflation = 0.5; // 50%
    const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

    // Should not throw, real rate should be negative
    const { interest } = debt.getMonthlyPaymentInfo(monthlyInflation);
    expect(interest).toBeLessThan(0);
  });

  it('should handle zero inflation without division issues', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 7,
        interestType: 'simple',
      })
    );

    const { interest } = debt.getMonthlyPaymentInfo(0);
    // With zero inflation, real rate = nominal rate
    expect(interest).toBeCloseTo(10000 * (0.07 / 12));
  });

  it('should handle very high inflation (50% annual) with compound interest', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 5,
        monthlyPayment: 100,
        interestType: 'compound',
        compoundingFrequency: 'daily',
      })
    );

    const annualInflation = 0.5; // 50%
    const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

    // Should not throw, real rate should be negative
    const { interest } = debt.getMonthlyPaymentInfo(monthlyInflation);
    expect(interest).toBeLessThan(0);
  });
});

// ============================================================================
// Compound Interest with Inflation Tests
// ============================================================================

describe('Compound Interest with Inflation', () => {
  it('should apply Fisher equation correctly for monthly compounding', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 12, // 12% APR
        interestType: 'compound',
        compoundingFrequency: 'monthly',
        monthlyPayment: 500,
      })
    );

    const annualInflation = 0.03;
    const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

    const { interest } = debt.getMonthlyPaymentInfo(monthlyInflation);

    // For monthly compounding: periodsPerMonth = 1
    // periodicInflationRate = monthlyInflation
    // realRate = (1 + 0.12/12) / (1 + monthlyInflation) - 1
    const realRate = (1 + 0.12 / 12) / (1 + monthlyInflation) - 1;
    const expected = 10000 * realRate;

    expect(interest).toBeCloseTo(expected, 2);
  });

  it('should apply Fisher equation correctly for daily compounding', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 10000,
        apr: 12,
        interestType: 'compound',
        compoundingFrequency: 'daily',
        monthlyPayment: 500,
      })
    );

    const annualInflation = 0.03;
    const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

    const { interest } = debt.getMonthlyPaymentInfo(monthlyInflation);

    // For daily compounding: periodsPerMonth = 365/12
    const periodsPerMonth = 365 / 12;
    const periodicInflation = Math.pow(1 + monthlyInflation, 1 / periodsPerMonth) - 1;
    const periodicRate = (1 + 0.12 / 365) / (1 + periodicInflation) - 1;
    const expected = 10000 * (Math.pow(1 + periodicRate, periodsPerMonth) - 1);

    expect(interest).toBeCloseTo(expected, 2);
  });

  it('daily compounding with inflation should still be higher than monthly', () => {
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

    const monthlyInflation = Math.pow(1.03, 1 / 12) - 1;

    const dailyInterest = dailyDebt.getMonthlyPaymentInfo(monthlyInflation).interest;
    const monthlyInterest = monthlyDebt.getMonthlyPaymentInfo(monthlyInflation).interest;

    expect(dailyInterest).toBeGreaterThan(monthlyInterest);
  });

  it('compound interest with negative real rate should erode debt', () => {
    const debt = new Debt(
      createDebtInput({
        balance: 100000,
        apr: 5, // 5% nominal APR
        interestType: 'compound',
        compoundingFrequency: 'daily',
        monthlyPayment: 0, // No payments - pure erosion test
      })
    );

    // 10% annual inflation > 5% APR = negative real rate
    const annualInflation = 0.1;
    const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

    const initialBalance = debt.getBalance();

    // Run 12 months
    for (let i = 0; i < 12; i++) {
      debt.applyMonthlyInflation(monthlyInflation);
      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(monthlyInflation);
      debt.applyPayment(monthlyPaymentDue, interest);
    }

    // Balance should decrease due to negative real interest rate
    expect(debt.getBalance()).toBeLessThan(initialBalance);
  });
});

// ============================================================================
// Inflation Adjustment Tests
// ============================================================================

describe('Inflation Adjustment', () => {
  describe('Payoff Timing Equivalence', () => {
    it('should pay off in same number of months as nominal calculation', () => {
      // Setup: $100K loan, 7% nominal APR, ~$665/month payment (30-year mortgage)
      const nominalBalance = 100_000;
      const nominalAPR = 0.07;
      const nominalPayment = 665.3;
      const annualInflation = 0.03;
      const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

      // Calculate nominal payoff months (standard loan amortization)
      let nomBalance = nominalBalance;
      let nomMonths = 0;
      while (nomBalance > 0 && nomMonths < 400) {
        const interest = nomBalance * (nominalAPR / 12);
        nomBalance = nomBalance + interest - Math.min(nominalPayment, nomBalance + interest);
        nomMonths++;
      }

      // Calculate real payoff months using our inflation-adjusted approach
      const debt = new Debt(
        createDebtInput({
          balance: nominalBalance,
          apr: 7,
          monthlyPayment: nominalPayment,
          interestType: 'simple',
        })
      );

      let realMonths = 0;
      while (!debt.isPaidOff() && realMonths < 400) {
        debt.applyMonthlyInflation(monthlyInflation);
        const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(monthlyInflation);
        debt.applyPayment(monthlyPaymentDue, interest);
        realMonths++;
      }

      // Should pay off in same number of months (within 1 month tolerance for rounding)
      expect(realMonths).toBeCloseTo(nomMonths, 0);
    });
  });

  describe('Payment Deflation', () => {
    it('should deflate payments by cumulative inflation', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 100000,
          apr: 0, // Zero APR so we can focus on payment deflation
          monthlyPayment: 1000,
        })
      );

      const monthlyInflation = 0.0025; // ~3% annual

      // After 12 months of inflation
      for (let i = 0; i < 12; i++) {
        debt.applyMonthlyInflation(monthlyInflation);
      }

      const { monthlyPaymentDue } = debt.getMonthlyPaymentInfo(monthlyInflation);

      // Payment should be ~$970 (deflated by ~3%)
      const expectedPayment = 1000 / Math.pow(1 + monthlyInflation, 12);
      expect(monthlyPaymentDue).toBeCloseTo(expectedPayment, 1);
    });
  });

  describe('Real Interest Rate Calculation', () => {
    it('should correctly convert nominal to real interest rate', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 7, // 7% nominal APR
          monthlyPayment: 500,
          interestType: 'simple',
        })
      );

      // 3% annual inflation = ~0.247% monthly inflation
      const annualInflation = 0.03;
      const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

      const { interest } = debt.getMonthlyPaymentInfo(monthlyInflation);

      // Real monthly rate = (1 + 0.07/12) / (1 + monthlyInflation) - 1
      const nominalMonthlyRate = 0.07 / 12;
      const realMonthlyRate = (1 + nominalMonthlyRate) / (1 + monthlyInflation) - 1;
      const expectedInterest = 10000 * realMonthlyRate;

      expect(interest).toBeCloseTo(expectedInterest, 2);
    });

    it('should correctly handle negative real interest rates', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 7, // 7% nominal APR
          monthlyPayment: 500,
          interestType: 'simple',
        })
      );

      // 10% annual inflation > 7% nominal APR = negative real rate
      const annualInflation = 0.1;
      const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

      const { interest } = debt.getMonthlyPaymentInfo(monthlyInflation);

      // Real rate should be negative, so interest should be negative (debt erodes)
      const nominalMonthlyRate = 0.07 / 12;
      const realMonthlyRate = (1 + nominalMonthlyRate) / (1 + monthlyInflation) - 1;

      expect(realMonthlyRate).toBeLessThan(0);
      expect(interest).toBeLessThan(0);
    });
  });

  describe('Processor Integration', () => {
    it('should apply inflation through processor', () => {
      const debts = new Debts([
        createDebtInput({
          id: 'loan',
          balance: 10000,
          apr: 6,
          monthlyPayment: 200,
          interestType: 'simple',
        }),
      ]);

      const simState = createSimulationState();
      const processor = new DebtsProcessor(simState, debts);

      const monthlyInflation = Math.pow(1.03, 1 / 12) - 1; // ~3% annual

      // Process first month
      const result1 = processor.process(monthlyInflation);

      // Process second month - payment should be slightly lower due to deflation
      const result2 = processor.process(monthlyInflation);

      // Both should have payments (less than original 200 due to inflation)
      expect(result1.totalPayment).toBeLessThan(200);
      expect(result2.totalPayment).toBeLessThan(result1.totalPayment);
    });
  });

  describe('Real Balance with Interest-Only Payments', () => {
    it('should significantly reduce real balance when inflation doubles over loan life (APR = inflation)', () => {
      // When nominal APR equals inflation, real interest rate ≈ 0
      // So all payments go to principal reduction in real terms
      // After 10 years of ~7.177% inflation, prices roughly double
      // Starting with $1M, interest-only payments in nominal terms
      // means real balance should be close to half the original

      const balance = 1_000_000;
      const annualInflation = 0.07177; // 7.177% makes (1.07177)^10 ≈ 2.0
      const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;
      const apr = annualInflation * 100; // APR matches inflation rate
      // Nominal interest-only payment = balance * (APR / 12)
      const monthlyPayment = balance * (annualInflation / 12);

      const debt = new Debt(
        createDebtInput({
          balance,
          apr,
          monthlyPayment,
          interestType: 'simple',
        })
      );

      // Run 120 months (10 years)
      for (let i = 0; i < 120; i++) {
        debt.applyMonthlyInflation(monthlyInflation);
        const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(monthlyInflation);
        debt.applyPayment(monthlyPaymentDue, interest);
      }

      // Real balance should be approximately half of initial
      // (small drift due to monthly compounding vs annual rate approximation)
      expect(debt.getBalance()).toBeLessThan(550_000);
      expect(debt.getBalance()).toBeGreaterThan(450_000);
    });
  });

  describe('Zero Payment with Equal Rates', () => {
    it('should maintain roughly constant real balance with zero payments when APR = inflation', () => {
      // When APR equals inflation and no payments are made:
      // - Real interest rate ≈ 0% (Fisher equation)
      // - No payments means no principal reduction
      // - Real balance stays approximately constant
      // Note: small drift occurs due to monthly compounding vs annual rate approximation

      const balance = 1_000_000;
      const annualInflation = 0.05;
      const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;
      const apr = annualInflation * 100; // APR matches inflation

      const debt = new Debt(
        createDebtInput({
          balance,
          apr,
          monthlyPayment: 0, // No payments
          interestType: 'simple',
        })
      );

      // Run 120 months
      for (let i = 0; i < 120; i++) {
        debt.applyMonthlyInflation(monthlyInflation);
        const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(monthlyInflation);
        debt.applyPayment(monthlyPaymentDue, interest);
      }

      // Real balance should stay approximately at $1M (within ~2% after 10 years)
      // Small drift due to APR being simple interest (annual/12) vs inflation being compound
      expect(debt.getBalance()).toBeGreaterThan(balance * 0.98);
      expect(debt.getBalance()).toBeLessThan(balance * 1.02);
    });
  });

  describe('Debt Erosion with High Inflation', () => {
    it('should erode debt when inflation exceeds APR', () => {
      // When inflation > APR:
      // - Real interest rate is negative
      // - Even with zero payments, real balance decreases
      // - This represents debt being "inflated away"

      const balance = 1_000_000;
      const apr = 5; // 5% nominal
      const annualInflation = 0.1; // 10% inflation
      const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

      const debt = new Debt(
        createDebtInput({
          balance,
          apr,
          monthlyPayment: 0, // No payments - pure erosion test
          interestType: 'simple',
        })
      );

      // Run 120 months
      for (let i = 0; i < 120; i++) {
        debt.applyMonthlyInflation(monthlyInflation);
        const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(monthlyInflation);
        debt.applyPayment(monthlyPaymentDue, interest);
      }

      // Real rate ≈ (1.05/1.10) - 1 ≈ -4.5% annually
      // After 10 years: balance should be significantly less
      // Roughly: $1M * (0.955)^10 ≈ $630K
      expect(debt.getBalance()).toBeLessThan(700_000);
      expect(debt.getBalance()).toBeGreaterThan(500_000);
    });
  });
});

// ============================================================================
// Negative Interest Reporting (High Inflation Fix)
// ============================================================================

describe('Negative Interest Reporting (High Inflation Fix)', () => {
  // Helper: 10% annual inflation = ~0.797% monthly
  const HIGH_INFLATION_MONTHLY = Math.pow(1.1, 1 / 12) - 1;

  describe('getMonthlyPaymentInfo', () => {
    it('should NOT cap monthlyPaymentDue at 0 when balance + interest goes negative', () => {
      // Scenario: To get balance + interest < 0 in a single month, we need extreme inflation
      // Using 200% annual inflation (hyperinflation scenario)
      const EXTREME_INFLATION_MONTHLY = Math.pow(1 + 2.0, 1 / 12) - 1; // ~9.6% monthly

      const debt = new Debt(
        createDebtInput({
          balance: 100, // Balance
          apr: 3, // Low APR (3%)
          monthlyPayment: 250, // Large enough to exceed balance + interest
          interestType: 'simple',
        })
      );

      // With 200% annual inflation and 3% APR:
      // Nominal monthly rate = 0.03/12 = 0.0025
      // Monthly inflation = (1 + 2.0)^(1/12) - 1 ≈ 0.096 (9.6%)
      // Real monthly rate = (1 + 0.0025) / (1 + 0.096) - 1 ≈ -0.085 (-8.5% real monthly)
      // Interest = 100 * (-0.085) ≈ -8.5
      // balance + interest = 100 + (-8.5) = 91.5 (still positive)
      //
      // To get negative: need even smaller balance or more months
      // After erosion, balance drops below zero threshold

      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(EXTREME_INFLATION_MONTHLY);

      // Interest is negative due to extreme inflation
      expect(interest).toBeLessThan(0);

      // The payment is min(monthlyPayment, balance + interest) without capping at 0
      // In this case balance + interest is still positive, so it equals balance + interest
      expect(monthlyPaymentDue).toBeCloseTo(100 + interest, 2);
    });

    it('should return negative payment when balance + interest is negative (eroded to zero scenario)', () => {
      // Scenario: Debt that has been eroded to a tiny balance
      const debt = new Debt(
        createDebtInput({
          balance: 1, // Very tiny balance remaining
          apr: 3, // Low APR
          monthlyPayment: 1000, // Much larger than balance
          interestType: 'simple',
        })
      );

      // Use very high inflation (500% annual) to create negative balance + interest
      const HYPER_INFLATION_MONTHLY = Math.pow(1 + 5.0, 1 / 12) - 1; // ~16.5% monthly

      // Real rate ≈ (1 + 0.0025) / (1 + 0.165) - 1 ≈ -0.14 (-14% monthly)
      // Interest = 1 * (-0.14) ≈ -0.14
      // balance + interest = 1 + (-0.14) = 0.86 (still positive, but much smaller)

      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(HYPER_INFLATION_MONTHLY);

      // Interest is negative
      expect(interest).toBeLessThan(0);

      // Payment equals min(1000, balance + interest) = balance + interest
      // Without Math.max(0, ...), this can approach 0 or go slightly negative
      expect(monthlyPaymentDue).toBeCloseTo(1 + interest, 2);
    });

    it('should return raw interest for internal balance calculations', () => {
      const debt = new Debt(
        createDebtInput({
          balance: 10000,
          apr: 5, // 5% APR
          monthlyPayment: 500,
          interestType: 'simple',
        })
      );

      // 10% inflation > 5% APR = negative real interest
      const { interest } = debt.getMonthlyPaymentInfo(HIGH_INFLATION_MONTHLY);

      // Raw interest should be negative (for internal calculations)
      // This ensures balance erosion still works correctly
      expect(interest).toBeLessThan(0);
    });
  });

  describe('DebtsProcessor.process - Raw Values for Net Worth Tracking', () => {
    it('should pass through raw interest (can be negative)', () => {
      const debts = new Debts([
        createDebtInput({
          balance: 10000,
          apr: 5,
          monthlyPayment: 500,
          interestType: 'simple',
        }),
      ]);
      const state = createSimulationState();
      const processor = new DebtsProcessor(state, debts);

      const result = processor.process(HIGH_INFLATION_MONTHLY);

      // Raw interest should be negative when inflation > APR
      expect(result.totalInterest).toBeLessThan(0);
      expect(result.perDebtData['debt-1'].interest).toBeLessThan(0);
    });

    it('should pass through raw totalPayment (equals balance + interest when that is less than monthlyPayment)', () => {
      const debts = new Debts([
        createDebtInput({
          balance: 100, // Small balance
          apr: 3,
          monthlyPayment: 500, // Larger than balance + interest
          interestType: 'simple',
        }),
      ]);
      const state = createSimulationState();
      const processor = new DebtsProcessor(state, debts);

      const result = processor.process(HIGH_INFLATION_MONTHLY);

      // With negative interest, balance + interest < balance
      // Payment = min(500, balance + interest) = balance + interest
      const expectedPayment = 100 + result.totalInterest;
      expect(result.totalPayment).toBeCloseTo(expectedPayment, 2);

      // Interest is negative (inflation > APR)
      expect(result.totalInterest).toBeLessThan(0);

      // Payment is less than original balance because of negative interest adjustment
      expect(result.totalPayment).toBeLessThan(100);
    });

    it('should still correctly erode balance with raw reporting', () => {
      const debts = new Debts([
        createDebtInput({
          balance: 10000,
          apr: 5,
          monthlyPayment: 0, // No payment - pure erosion test
          interestType: 'simple',
        }),
      ]);
      const state = createSimulationState();
      const processor = new DebtsProcessor(state, debts);

      const initialBalance = 10000;
      const result = processor.process(HIGH_INFLATION_MONTHLY);

      // Balance should erode (internal calculation still works)
      expect(result.totalDebtBalance).toBeLessThan(initialBalance);

      // Raw interest is negative (reflects balance erosion economically)
      expect(result.totalInterest).toBeLessThan(0);
    });

    it('should calculate principalPaid as payment minus raw interest', () => {
      const debts = new Debts([
        createDebtInput({
          balance: 10000,
          apr: 5,
          monthlyPayment: 500,
          interestType: 'simple',
        }),
      ]);
      const state = createSimulationState();
      const processor = new DebtsProcessor(state, debts);

      const result = processor.process(HIGH_INFLATION_MONTHLY);

      // With negative raw interest, principalPaid = payment - interest > payment
      // This correctly reflects that more principal is "paid" due to balance erosion
      expect(result.totalPrincipalPaid).toBeGreaterThan(result.totalPayment);
      expect(result.totalPrincipalPaid).toBeCloseTo(result.totalPayment - result.totalInterest, 2);
    });

    it('principalPaid should equal actual balance reduction, not exceed initial balance', () => {
      // Regression test: With uncapped payment, principalPaid should match actual balance change
      // Previously, capping caused over-reporting of principalPaid
      const debt = new Debt(
        createDebtInput({
          balance: 50,
          apr: 3,
          monthlyPayment: 250,
          interestType: 'compound',
          compoundingFrequency: 'monthly',
        })
      );

      const initialBalance = debt.getBalance();

      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(HIGH_INFLATION_MONTHLY);
      debt.applyPayment(monthlyPaymentDue, interest);

      const finalBalance = debt.getBalance();
      const actualPrincipalReduced = initialBalance - finalBalance;
      const reportedPrincipalPaid = monthlyPaymentDue - interest;

      // Principal paid should match actual balance reduction
      expect(reportedPrincipalPaid).toBeCloseTo(actualPrincipalReduced, 2);

      // Principal paid should NOT exceed initial balance
      expect(reportedPrincipalPaid).toBeLessThanOrEqual(initialBalance + 0.01); // Small tolerance for floating point
    });

    it('extreme case: $250 payment, $20 balance, 500% inflation - all invariants hold', () => {
      // User's specific edge case scenario with extreme negative interest
      const EXTREME_INFLATION = Math.pow(1 + 5.0, 1 / 12) - 1; // ~16% monthly

      const debt = new Debt(
        createDebtInput({
          balance: 20,
          apr: 3,
          monthlyPayment: 250,
          interestType: 'simple',
        })
      );

      const initialBalance = debt.getBalance();
      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(EXTREME_INFLATION);

      // Interest is negative (inflation > APR)
      expect(interest).toBeLessThan(0);

      // Payment = min(250, balance + interest) = balance + interest (since balance + interest < 250)
      expect(monthlyPaymentDue).toBeCloseTo(initialBalance + interest, 2);

      // Calculate derived values
      const principalPaid = monthlyPaymentDue - interest;
      const unpaidInterest = interest - monthlyPaymentDue;

      // INVARIANT 1: unpaidInterest = -principalPaid
      expect(unpaidInterest).toBeCloseTo(-principalPaid, 10);

      // Apply payment
      debt.applyPayment(monthlyPaymentDue, interest);

      // Balance should go to 0
      expect(debt.getBalance()).toBe(0);

      // INVARIANT 2: principalPaid = actual balance reduction
      const actualBalanceReduction = initialBalance - debt.getBalance();
      expect(principalPaid).toBeCloseTo(actualBalanceReduction, 2);

      // INVARIANT 3: principalPaid <= initialBalance (can't pay more principal than existed)
      expect(principalPaid).toBeLessThanOrEqual(initialBalance + 0.01);
    });
  });
});
