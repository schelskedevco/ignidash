import { describe, it, expect } from 'vitest';
import {
  contributionFormSchema,
  getAccountTypeLimitKey,
  getAnnualContributionLimit,
  getAnnualContributionLimitForAccount,
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

describe('getAnnualContributionLimitForAccount', () => {
  it('should return the standard annual limit for the account type', () => {
    expect(getAnnualContributionLimitForAccount('401k', 30)).toBe(24500);
    expect(getAnnualContributionLimitForAccount('rothIra', 50)).toBe(8600);
    expect(getAnnualContributionLimitForAccount('hsa', 55)).toBe(5400);
  });

  it('should use the Section 415(c) limit for mega backdoor Roth rules on supported accounts', () => {
    expect(getAnnualContributionLimitForAccount('roth401k', 30, { enableMegaBackdoorRoth: true })).toBe(72000);
    expect(getAnnualContributionLimitForAccount('roth403b', 50, { enableMegaBackdoorRoth: true })).toBe(80000);
  });

  it('should ignore mega backdoor Roth for unsupported accounts', () => {
    expect(getAnnualContributionLimitForAccount('rothIra', 30, { enableMegaBackdoorRoth: true })).toBe(7500);
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

const validDollarContribution = {
  id: 'test-id',
  accountId: 'acc-123',
  rank: 0,
  contributionType: 'dollarAmount' as const,
  dollarAmount: 6000,
};

describe('contributionFormSchema', () => {
  it('should accept valid dollarAmount contribution', () => {
    expect(contributionFormSchema.safeParse(validDollarContribution).success).toBe(true);
  });

  it('should accept valid percentRemaining contribution', () => {
    const result = contributionFormSchema.safeParse({
      id: 'test-id',
      accountId: 'acc-123',
      rank: 0,
      contributionType: 'percentRemaining',
      percentRemaining: 50,
    });
    expect(result.success).toBe(true);
  });

  it('should accept unlimited contribution', () => {
    const result = contributionFormSchema.safeParse({
      id: 'test-id',
      accountId: 'acc-123',
      rank: 0,
      contributionType: 'unlimited',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty accountId', () => {
    const result = contributionFormSchema.safeParse({
      ...validDollarContribution,
      accountId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject dollarAmount = 0', () => {
    const result = contributionFormSchema.safeParse({
      ...validDollarContribution,
      dollarAmount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject percentRemaining > 100', () => {
    const result = contributionFormSchema.safeParse({
      id: 'test-id',
      accountId: 'acc-123',
      rank: 0,
      contributionType: 'percentRemaining',
      percentRemaining: 101,
    });
    expect(result.success).toBe(false);
  });

  it('should coerce string dollarAmount', () => {
    const result = contributionFormSchema.safeParse({
      ...validDollarContribution,
      dollarAmount: '6000',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional fields as undefined', () => {
    const result = contributionFormSchema.safeParse({
      ...validDollarContribution,
      maxBalance: undefined,
      employerMatch: undefined,
      incomeId: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional maxBalance when provided', () => {
    const result = contributionFormSchema.safeParse({
      ...validDollarContribution,
      maxBalance: 50000,
    });
    expect(result.success).toBe(true);
  });

  it('should reject maxBalance of 0', () => {
    const result = contributionFormSchema.safeParse({
      ...validDollarContribution,
      maxBalance: 0,
    });
    expect(result.success).toBe(false);
  });
});
