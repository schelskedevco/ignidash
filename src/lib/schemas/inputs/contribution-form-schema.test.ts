import { describe, it, expect } from 'vitest';
import {
  getAccountTypeLimitKey,
  getAnnualContributionLimit,
  getAnnualSection415cLimit,
  supportsMaxBalance,
  supportsIncomeAllocation,
  supportsEmployerMatch,
  supportsMegaBackdoorRoth,
} from './contribution-form-schema';
import type { AccountInputs } from './account-form-schema';

const ALL_ACCOUNT_TYPES: AccountInputs['type'][] = [
  'savings',
  'taxableBrokerage',
  'roth401k',
  'roth403b',
  'rothIra',
  '401k',
  '403b',
  'ira',
  'hsa',
];

describe('getAccountTypeLimitKey', () => {
  it('should map 401k/403b/roth variants to 401kCombined', () => {
    expect(getAccountTypeLimitKey('401k')).toBe('401kCombined');
    expect(getAccountTypeLimitKey('403b')).toBe('401kCombined');
    expect(getAccountTypeLimitKey('roth401k')).toBe('401kCombined');
    expect(getAccountTypeLimitKey('roth403b')).toBe('401kCombined');
  });

  it('should map ira/rothIra to iraCombined', () => {
    expect(getAccountTypeLimitKey('ira')).toBe('iraCombined');
    expect(getAccountTypeLimitKey('rothIra')).toBe('iraCombined');
  });

  it('should pass through hsa, savings, taxableBrokerage', () => {
    expect(getAccountTypeLimitKey('hsa')).toBe('hsa');
    expect(getAccountTypeLimitKey('savings')).toBe('savings');
    expect(getAccountTypeLimitKey('taxableBrokerage')).toBe('taxableBrokerage');
  });
});

describe('getAnnualContributionLimit', () => {
  describe('401kCombined', () => {
    it('should return base limit for age < 50', () => {
      expect(getAnnualContributionLimit('401kCombined', 30)).toBe(24500);
      expect(getAnnualContributionLimit('401kCombined', 49)).toBe(24500);
    });

    it('should return catch-up limit for age 50-59', () => {
      expect(getAnnualContributionLimit('401kCombined', 50)).toBe(32500);
      expect(getAnnualContributionLimit('401kCombined', 59)).toBe(32500);
    });

    it('should return super catch-up limit for age 60-63', () => {
      expect(getAnnualContributionLimit('401kCombined', 60)).toBe(35750);
      expect(getAnnualContributionLimit('401kCombined', 63)).toBe(35750);
    });

    it('should return catch-up limit for age 64+', () => {
      expect(getAnnualContributionLimit('401kCombined', 64)).toBe(32500);
    });
  });

  describe('iraCombined', () => {
    it('should return base limit for age < 50', () => {
      expect(getAnnualContributionLimit('iraCombined', 30)).toBe(7500);
    });

    it('should return catch-up limit for age >= 50', () => {
      expect(getAnnualContributionLimit('iraCombined', 50)).toBe(8600);
    });
  });

  describe('hsa', () => {
    it('should return base limit for age < 55', () => {
      expect(getAnnualContributionLimit('hsa', 30)).toBe(4400);
    });

    it('should return catch-up limit for age >= 55', () => {
      expect(getAnnualContributionLimit('hsa', 55)).toBe(5400);
    });
  });

  it('should return Infinity for uncapped account types', () => {
    expect(getAnnualContributionLimit('savings', 30)).toBe(Infinity);
    expect(getAnnualContributionLimit('taxableBrokerage', 30)).toBe(Infinity);
  });
});

describe('getAnnualSection415cLimit', () => {
  it('should return base limit for age < 50', () => {
    expect(getAnnualSection415cLimit(30)).toBe(72000);
    expect(getAnnualSection415cLimit(49)).toBe(72000);
  });

  it('should return catch-up limit for age 50-59', () => {
    expect(getAnnualSection415cLimit(50)).toBe(80000);
    expect(getAnnualSection415cLimit(59)).toBe(80000);
  });

  it('should return super catch-up limit for age 60-63', () => {
    expect(getAnnualSection415cLimit(60)).toBe(83250);
    expect(getAnnualSection415cLimit(63)).toBe(83250);
  });

  it('should return catch-up limit for age 64+', () => {
    expect(getAnnualSection415cLimit(64)).toBe(80000);
  });
});

describe('supportsMaxBalance', () => {
  it('should return true only for savings', () => {
    for (const type of ALL_ACCOUNT_TYPES) {
      expect(supportsMaxBalance(type)).toBe(type === 'savings');
    }
  });
});

describe('supportsIncomeAllocation', () => {
  it('should return true for all types except savings', () => {
    for (const type of ALL_ACCOUNT_TYPES) {
      expect(supportsIncomeAllocation(type)).toBe(type !== 'savings');
    }
  });
});

describe('supportsEmployerMatch', () => {
  it('should return true for employer-sponsored plans and HSA', () => {
    const supported = new Set(['401k', '403b', 'roth401k', 'roth403b', 'hsa']);
    for (const type of ALL_ACCOUNT_TYPES) {
      expect(supportsEmployerMatch(type)).toBe(supported.has(type));
    }
  });
});

describe('supportsMegaBackdoorRoth', () => {
  it('should return true only for roth401k and roth403b', () => {
    const supported = new Set(['roth401k', 'roth403b']);
    for (const type of ALL_ACCOUNT_TYPES) {
      expect(supportsMegaBackdoorRoth(type)).toBe(supported.has(type));
    }
  });
});
