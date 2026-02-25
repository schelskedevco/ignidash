import { describe, expect, it, vi } from 'vitest';
import { calculateTokenCost } from './ai_utils';

// TOKEN_COSTS: input = $1.75/1M, cachedInput = $0.175/1M, output = $14.00/1M

describe('calculateTokenCost', () => {
  it('calculates cost with no cached tokens', () => {
    // 1000 input @ $1.75/1M + 500 output @ $14.00/1M
    const cost = calculateTokenCost(1000, 0, 500);
    const expected = (1000 * 1.75) / 1_000_000 + (500 * 14.0) / 1_000_000;
    expect(cost).toBeCloseTo(expected);
  });

  it('calculates cost with all tokens cached', () => {
    // 1000 input, all cached @ $0.175/1M + 500 output @ $14.00/1M
    const cost = calculateTokenCost(1000, 1000, 500);
    const expected = (1000 * 0.175) / 1_000_000 + (500 * 14.0) / 1_000_000;
    expect(cost).toBeCloseTo(expected);
  });

  it('calculates cost with partial cached tokens', () => {
    // 15237 input, 14592 cached (from real usage example)
    // uncached: 645 @ $1.75/1M, cached: 14592 @ $0.175/1M, output: 500 @ $14.00/1M
    const cost = calculateTokenCost(15237, 14592, 500);
    const expected = (645 * 1.75) / 1_000_000 + (14592 * 0.175) / 1_000_000 + (500 * 14.0) / 1_000_000;
    expect(cost).toBeCloseTo(expected);
  });

  it('cached tokens reduce cost significantly vs non-cached', () => {
    const noCacheCost = calculateTokenCost(15237, 0, 500);
    const withCacheCost = calculateTokenCost(15237, 14592, 500);
    expect(withCacheCost).toBeLessThan(noCacheCost);
    // With 96% cached, the input portion should be much cheaper
    expect(withCacheCost).toBeLessThan(noCacheCost / 2);
  });

  it('returns 0 for zero tokens', () => {
    expect(calculateTokenCost(0, 0, 0)).toBe(0);
  });

  it('handles output-only cost', () => {
    const cost = calculateTokenCost(0, 0, 1_000_000);
    expect(cost).toBeCloseTo(14.0);
  });

  it('handles input-only cost with no cache', () => {
    const cost = calculateTokenCost(1_000_000, 0, 0);
    expect(cost).toBeCloseTo(1.75);
  });

  it('handles input-only cost fully cached', () => {
    const cost = calculateTokenCost(1_000_000, 1_000_000, 0);
    expect(cost).toBeCloseTo(0.175);
  });

  it('warns and does not produce negative cost when cachedInputTokens exceeds inputTokens', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cost = calculateTokenCost(100, 500, 0);
    expect(cost).toBeGreaterThanOrEqual(0);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith('cachedInputTokens (500) exceeds inputTokens (100)');
    warnSpy.mockRestore();
  });
});
