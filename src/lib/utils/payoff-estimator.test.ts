import { describe, it, expect } from 'vitest';
import { estimatePayoffMonths, formatPayoffEstimate } from './payoff-estimator';

describe('estimatePayoffMonths', () => {
  it('handles 0% APR correctly', () => {
    expect(
      estimatePayoffMonths({
        balance: 1000,
        apr: 0,
        monthlyPayment: 100,
        interestType: 'simple',
      })
    ).toBe(10);
  });

  it('calculates simple interest payoff', () => {
    const months = estimatePayoffMonths({
      balance: 10000,
      apr: 18,
      monthlyPayment: 500,
      interestType: 'simple',
    });
    expect(months).toBeGreaterThan(20);
    expect(months).toBeLessThan(30);
  });

  it('calculates compound monthly interest payoff', () => {
    const months = estimatePayoffMonths({
      balance: 10000,
      apr: 18,
      monthlyPayment: 500,
      interestType: 'compound',
      compoundingFrequency: 'monthly',
    });
    expect(months).toBeGreaterThan(20);
    expect(months).toBeLessThan(30);
  });

  it('calculates compound daily interest payoff', () => {
    const months = estimatePayoffMonths({
      balance: 10000,
      apr: 18,
      monthlyPayment: 500,
      interestType: 'compound',
      compoundingFrequency: 'daily',
    });
    expect(months).toBeGreaterThan(20);
    expect(months).toBeLessThan(30);
  });

  it('returns Infinity when payment is less than interest', () => {
    expect(
      estimatePayoffMonths({
        balance: 10000,
        apr: 24,
        monthlyPayment: 150,
        interestType: 'simple',
      })
    ).toBe(Infinity);
  });

  it('returns null for zero balance', () => {
    expect(
      estimatePayoffMonths({
        balance: 0,
        apr: 18,
        monthlyPayment: 500,
        interestType: 'simple',
      })
    ).toBeNull();
  });

  it('returns null for zero payment', () => {
    expect(
      estimatePayoffMonths({
        balance: 10000,
        apr: 18,
        monthlyPayment: 0,
        interestType: 'simple',
      })
    ).toBeNull();
  });

  it('calculates 30-year mortgage correctly', () => {
    const months = estimatePayoffMonths({
      balance: 320000,
      apr: 6,
      monthlyPayment: 1918.56,
      interestType: 'simple',
    });
    expect(months).toBeGreaterThan(355);
    expect(months).toBeLessThan(365);
  });
});

describe('formatPayoffEstimate', () => {
  it('formats months only', () => {
    expect(formatPayoffEstimate(5)).toBe('5 months');
    expect(formatPayoffEstimate(1)).toBe('1 month');
  });

  it('formats years only', () => {
    expect(formatPayoffEstimate(24)).toBe('2 years');
    expect(formatPayoffEstimate(12)).toBe('1 year');
  });

  it('formats years and months', () => {
    expect(formatPayoffEstimate(15)).toBe('1 yr, 3 mo');
    expect(formatPayoffEstimate(25)).toBe('2 yrs, 1 mo');
  });

  it('formats Infinity as never', () => {
    expect(formatPayoffEstimate(Infinity)).toBe('Never (payment too low)');
  });
});
