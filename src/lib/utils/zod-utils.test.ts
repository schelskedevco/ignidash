import { describe, it, expect } from 'vitest';
import { coerceNumber, currencyFieldAllowsZero, currencyFieldForbidsZero, percentageField, ageField } from './zod-utils';
import { z } from 'zod';

describe('coerceNumber', () => {
  const schema = coerceNumber(z.number());

  it('should coerce string to number', () => {
    expect(schema.parse('42')).toBe(42);
    expect(schema.parse('3.14')).toBeCloseTo(3.14);
  });

  it('should coerce empty string to null', () => {
    expect(schema.safeParse('').success).toBe(false);
  });

  it('should coerce null to null', () => {
    expect(schema.safeParse(null).success).toBe(false);
  });

  it('should coerce undefined to null', () => {
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it('should pass through numbers', () => {
    expect(schema.parse(100)).toBe(100);
  });
});

describe('currencyFieldAllowsZero', () => {
  const schema = currencyFieldAllowsZero();

  it('should accept zero', () => {
    expect(schema.parse(0)).toBe(0);
  });

  it('should accept positive values', () => {
    expect(schema.parse(50000)).toBe(50000);
  });

  it('should reject negative values', () => {
    expect(schema.safeParse(-1).success).toBe(false);
  });

  it('should reject values over max', () => {
    expect(schema.safeParse(100000000000).success).toBe(false);
  });

  it('should use custom message', () => {
    const custom = currencyFieldAllowsZero('Custom error');
    const result = custom.safeParse(-1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Custom error');
    }
  });
});

describe('currencyFieldForbidsZero', () => {
  const schema = currencyFieldForbidsZero();

  it('should reject zero', () => {
    expect(schema.safeParse(0).success).toBe(false);
  });

  it('should accept positive values', () => {
    expect(schema.parse(1)).toBe(1);
  });

  it('should reject negative values', () => {
    expect(schema.safeParse(-100).success).toBe(false);
  });
});

describe('percentageField', () => {
  it('should use default range 0-100', () => {
    const schema = percentageField();
    expect(schema.parse(0)).toBe(0);
    expect(schema.parse(50)).toBe(50);
    expect(schema.parse(100)).toBe(100);
    expect(schema.safeParse(-1).success).toBe(false);
    expect(schema.safeParse(101).success).toBe(false);
  });

  it('should use custom range', () => {
    const schema = percentageField(10, 50, 'Rate');
    expect(schema.parse(10)).toBe(10);
    expect(schema.parse(50)).toBe(50);
    expect(schema.safeParse(9).success).toBe(false);
    expect(schema.safeParse(51).success).toBe(false);
  });

  it('should include field name in error message', () => {
    const schema = percentageField(0, 100, 'Growth');
    const result = schema.safeParse(101);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Growth');
    }
  });
});

describe('ageField', () => {
  it('should use default range 16-100', () => {
    const schema = ageField();
    expect(schema.parse(16)).toBe(16);
    expect(schema.parse(100)).toBe(100);
    expect(schema.safeParse(15).success).toBe(false);
    expect(schema.safeParse(101).success).toBe(false);
  });

  it('should use custom range', () => {
    const schema = ageField(18, 70);
    expect(schema.parse(18)).toBe(18);
    expect(schema.parse(70)).toBe(70);
    expect(schema.safeParse(17).success).toBe(false);
    expect(schema.safeParse(71).success).toBe(false);
  });

  it('should use custom error messages', () => {
    const schema = ageField(16, 100, { min: 'Too young!', max: 'Too old!' });
    const tooYoung = schema.safeParse(10);
    expect(tooYoung.success).toBe(false);
    if (!tooYoung.success) {
      expect(tooYoung.error.issues[0].message).toBe('Too young!');
    }

    const tooOld = schema.safeParse(200);
    expect(tooOld.success).toBe(false);
    if (!tooOld.success) {
      expect(tooOld.error.issues[0].message).toBe('Too old!');
    }
  });
});
