import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency, getCurrencySymbol, formatCurrencyPlaceholder } from './currency-formatters';

describe('formatCurrency', () => {
  it('should format positive amounts without cents', () => {
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('should format negative amounts', () => {
    expect(formatCurrency(-5000)).toBe('-$5,000');
  });

  it('should format with cents when option is set', () => {
    expect(formatCurrency(1234.56, { cents: true })).toBe('$1,234.56');
    expect(formatCurrency(0, { cents: true })).toBe('$0.00');
  });

  it('should truncate cents by default', () => {
    expect(formatCurrency(1234.99)).toBe('$1,235');
  });
});

describe('formatCompactCurrency', () => {
  it('should format billions', () => {
    expect(formatCompactCurrency(1500000000)).toBe('$1.50B');
    expect(formatCompactCurrency(-2000000000)).toBe('-$2.00B');
  });

  it('should format millions', () => {
    expect(formatCompactCurrency(1500000)).toBe('$1.50M');
    expect(formatCompactCurrency(250000000)).toBe('$250.00M');
  });

  it('should format thousands', () => {
    expect(formatCompactCurrency(1500)).toBe('$1.5k');
    expect(formatCompactCurrency(200000)).toBe('$200.0k');
  });

  it('should format values under 1000', () => {
    expect(formatCompactCurrency(500)).toBe('$500.00');
    expect(formatCompactCurrency(0)).toBe('$0.00');
  });

  it('should handle negative values', () => {
    expect(formatCompactCurrency(-1500000)).toBe('-$1.50M');
    expect(formatCompactCurrency(-500)).toBe('-$500.00');
  });
});

describe('getCurrencySymbol', () => {
  it('should return $', () => {
    expect(getCurrencySymbol()).toBe('$');
  });
});

describe('formatCurrencyPlaceholder', () => {
  it('should format like formatCurrency without cents', () => {
    expect(formatCurrencyPlaceholder(100000)).toBe('$100,000');
  });
});
