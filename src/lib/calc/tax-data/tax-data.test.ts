import { describe, it, expect } from 'vitest';

import {
  INCOME_TAX_BRACKETS_SINGLE,
  INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY,
  INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD,
} from './income-tax-brackets';
import {
  CAPITAL_GAINS_TAX_BRACKETS_SINGLE,
  CAPITAL_GAINS_TAX_BRACKETS_MARRIED_FILING_JOINTLY,
  CAPITAL_GAINS_TAX_BRACKETS_HEAD_OF_HOUSEHOLD,
} from './capital-gains-tax-brackets';
import {
  STANDARD_DEDUCTION_SINGLE,
  STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY,
  STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD,
} from './standard-deduction';
import { NIIT_RATE, NIIT_THRESHOLDS } from './niit-thresholds';
import {
  SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE,
  SOCIAL_SECURITY_TAX_THRESHOLDS_MARRIED_FILING_JOINTLY,
  SOCIAL_SECURITY_TAX_THRESHOLDS_HEAD_OF_HOUSEHOLD,
} from './social-security-tax-brackets';

describe('Tax Data Validation (2026 IRS values)', () => {
  describe('income tax brackets', () => {
    it('should have correct Single 10% bracket: $0-$12,400', () => {
      expect(INCOME_TAX_BRACKETS_SINGLE[0]).toEqual({ min: 0, max: 12400, rate: 0.1 });
    });

    it('should have correct MFJ 22% bracket: $100,800-$211,400', () => {
      expect(INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY[2]).toEqual({ min: 100800, max: 211400, rate: 0.22 });
    });

    it('should have correct HOH 10% bracket: $0-$17,700', () => {
      expect(INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD[0]).toEqual({ min: 0, max: 17700, rate: 0.1 });
    });

    it.each([
      ['single', INCOME_TAX_BRACKETS_SINGLE],
      ['MFJ', INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY],
      ['HOH', INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD],
    ] as const)('%s brackets should be sorted by min ascending', (_name, brackets) => {
      for (let i = 1; i < brackets.length; i++) {
        expect(brackets[i].min).toBeGreaterThanOrEqual(brackets[i - 1].min);
      }
    });

    it.each([
      ['single', INCOME_TAX_BRACKETS_SINGLE],
      ['MFJ', INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY],
      ['HOH', INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD],
    ] as const)('%s brackets should have last bracket max as Infinity', (_name, brackets) => {
      expect(brackets[brackets.length - 1].max).toBe(Infinity);
    });

    it.each([
      ['single', INCOME_TAX_BRACKETS_SINGLE],
      ['MFJ', INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY],
      ['HOH', INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD],
    ] as const)('%s brackets should have 7 brackets', (_name, brackets) => {
      expect(brackets).toHaveLength(7);
    });

    it.each([
      ['single', INCOME_TAX_BRACKETS_SINGLE],
      ['MFJ', INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY],
      ['HOH', INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD],
    ] as const)('%s brackets should be contiguous (each bracket.max === next bracket.min)', (_name, brackets) => {
      for (let i = 0; i < brackets.length - 1; i++) {
        expect(brackets[i].max).toBe(brackets[i + 1].min);
      }
    });
  });

  describe('capital gains tax brackets', () => {
    it('should have correct Single 0% threshold: $49,450', () => {
      expect(CAPITAL_GAINS_TAX_BRACKETS_SINGLE[0]).toEqual({ min: 0, max: 49450, rate: 0.0 });
    });

    it('should have correct MFJ 0% threshold: $98,900', () => {
      expect(CAPITAL_GAINS_TAX_BRACKETS_MARRIED_FILING_JOINTLY[0]).toEqual({ min: 0, max: 98900, rate: 0.0 });
    });

    it('should have correct HOH 0% threshold: $66,200', () => {
      expect(CAPITAL_GAINS_TAX_BRACKETS_HEAD_OF_HOUSEHOLD[0]).toEqual({ min: 0, max: 66200, rate: 0.0 });
    });

    it.each([
      ['single', CAPITAL_GAINS_TAX_BRACKETS_SINGLE],
      ['MFJ', CAPITAL_GAINS_TAX_BRACKETS_MARRIED_FILING_JOINTLY],
      ['HOH', CAPITAL_GAINS_TAX_BRACKETS_HEAD_OF_HOUSEHOLD],
    ] as const)('%s brackets should have 3 brackets with rates 0%%, 15%%, 20%%', (_name, brackets) => {
      expect(brackets).toHaveLength(3);
      expect(brackets[0].rate).toBe(0.0);
      expect(brackets[1].rate).toBe(0.15);
      expect(brackets[2].rate).toBe(0.2);
    });

    it.each([
      ['single', CAPITAL_GAINS_TAX_BRACKETS_SINGLE],
      ['MFJ', CAPITAL_GAINS_TAX_BRACKETS_MARRIED_FILING_JOINTLY],
      ['HOH', CAPITAL_GAINS_TAX_BRACKETS_HEAD_OF_HOUSEHOLD],
    ] as const)('%s brackets should have last bracket max as Infinity', (_name, brackets) => {
      expect(brackets[brackets.length - 1].max).toBe(Infinity);
    });
  });

  describe('standard deductions', () => {
    it('should have correct values for each filing status', () => {
      expect(STANDARD_DEDUCTION_SINGLE).toBe(16100);
      expect(STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY).toBe(32200);
      expect(STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD).toBe(24150);
    });

    it('MFJ should be exactly 2x single', () => {
      expect(STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY).toBe(STANDARD_DEDUCTION_SINGLE * 2);
    });
  });

  describe('NIIT', () => {
    it('should have 3.8% rate', () => {
      expect(NIIT_RATE).toBe(0.038);
    });

    it('should have correct thresholds per filing status', () => {
      expect(NIIT_THRESHOLDS.single).toBe(200000);
      expect(NIIT_THRESHOLDS.marriedFilingJointly).toBe(250000);
      expect(NIIT_THRESHOLDS.headOfHousehold).toBe(200000);
    });
  });

  describe('Social Security tax tiers', () => {
    it('should have correct Single thresholds: $25k / $34k', () => {
      expect(SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE[0]).toEqual({ min: 0, max: 25000, taxablePercentage: 0 });
      expect(SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE[1]).toEqual({ min: 25000, max: 34000, taxablePercentage: 0.5 });
      expect(SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE[2]).toEqual({ min: 34000, max: Infinity, taxablePercentage: 0.85 });
    });

    it('should have correct MFJ thresholds: $32k / $44k', () => {
      expect(SOCIAL_SECURITY_TAX_THRESHOLDS_MARRIED_FILING_JOINTLY[0]).toEqual({ min: 0, max: 32000, taxablePercentage: 0 });
      expect(SOCIAL_SECURITY_TAX_THRESHOLDS_MARRIED_FILING_JOINTLY[1]).toEqual({ min: 32000, max: 44000, taxablePercentage: 0.5 });
      expect(SOCIAL_SECURITY_TAX_THRESHOLDS_MARRIED_FILING_JOINTLY[2]).toEqual({
        min: 44000,
        max: Infinity,
        taxablePercentage: 0.85,
      });
    });

    it('HOH thresholds should match Single', () => {
      expect(SOCIAL_SECURITY_TAX_THRESHOLDS_HEAD_OF_HOUSEHOLD).toEqual(SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE);
    });

    it.each([
      ['single', SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE],
      ['MFJ', SOCIAL_SECURITY_TAX_THRESHOLDS_MARRIED_FILING_JOINTLY],
      ['HOH', SOCIAL_SECURITY_TAX_THRESHOLDS_HEAD_OF_HOUSEHOLD],
    ] as const)('%s should have 3 tiers (0%%, 50%%, 85%%)', (_name, thresholds) => {
      expect(thresholds).toHaveLength(3);
      expect(thresholds[0].taxablePercentage).toBe(0);
      expect(thresholds[1].taxablePercentage).toBe(0.5);
      expect(thresholds[2].taxablePercentage).toBe(0.85);
    });
  });
});
