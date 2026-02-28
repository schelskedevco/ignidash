import { describe, it, expect } from 'vitest';
import { supportsWithholding, defaultWithholding } from './income-form-schema';
import type { IncomeType } from './income-form-schema';

const ALL_INCOME_TYPES: IncomeType[] = ['wage', 'socialSecurity', 'exempt', 'selfEmployment', 'pension'];

describe('supportsWithholding', () => {
  it('should return true for wage and socialSecurity', () => {
    expect(supportsWithholding('wage')).toBe(true);
    expect(supportsWithholding('socialSecurity')).toBe(true);
  });

  it('should return false for other types', () => {
    expect(supportsWithholding('exempt')).toBe(false);
    expect(supportsWithholding('selfEmployment')).toBe(false);
    expect(supportsWithholding('pension')).toBe(false);
  });
});

describe('defaultWithholding', () => {
  it('should return 20 for wage', () => {
    expect(defaultWithholding('wage')).toBe(20);
  });

  it('should return 0 for socialSecurity', () => {
    expect(defaultWithholding('socialSecurity')).toBe(0);
  });

  it('should return undefined for types without withholding', () => {
    expect(defaultWithholding('exempt')).toBeUndefined();
    expect(defaultWithholding('selfEmployment')).toBeUndefined();
    expect(defaultWithholding('pension')).toBeUndefined();
  });

  it('should cover all income types', () => {
    for (const type of ALL_INCOME_TYPES) {
      const result = defaultWithholding(type);
      expect(result === undefined || typeof result === 'number').toBe(true);
    }
  });
});
