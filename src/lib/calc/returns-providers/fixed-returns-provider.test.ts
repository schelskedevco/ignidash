import { describe, it, expect } from 'vitest';

import { FixedReturnsProvider } from './fixed-returns-provider';
import { createSimulatorInputs, createDefaultMarketAssumptions } from '../__tests__/test-utils';

// ============================================================================
// Fisher Equation Edge Case Tests
// ============================================================================

/**
 * The Fisher equation relates nominal returns, real returns, and inflation:
 *   (1 + nominal) = (1 + real) × (1 + inflation)
 *
 * Rearranging for real return:
 *   real = (1 + nominal) / (1 + inflation) - 1
 *
 * These tests verify the FixedReturnsProvider correctly calculates real returns
 * from nominal returns across various inflation scenarios including edge cases.
 */

describe('FixedReturnsProvider', () => {
  describe('Fisher equation calculations', () => {
    it('should calculate correct real returns with standard inflation (3%)', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockReturn: 10,
          bondReturn: 5,
          cashReturn: 3,
          inflationRate: 3,
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const { returns, inflationRate } = provider.getReturns(null);

      // Fisher: real = (1 + nominal) / (1 + inflation) - 1
      // Stock: (1.10 / 1.03) - 1 ≈ 0.0680 (6.80%)
      // Bond: (1.05 / 1.03) - 1 ≈ 0.0194 (1.94%)
      // Cash: (1.03 / 1.03) - 1 = 0 (0%)
      expect(returns.stocks).toBeCloseTo(1.1 / 1.03 - 1, 6);
      expect(returns.bonds).toBeCloseTo(1.05 / 1.03 - 1, 6);
      expect(returns.cash).toBeCloseTo(0, 6);
      expect(inflationRate).toBe(0.03);
    });

    it('should handle high inflation scenario (10%+)', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockReturn: 12,
          bondReturn: 8,
          cashReturn: 6,
          inflationRate: 10,
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const { returns, inflationRate } = provider.getReturns(null);

      // With high inflation, real returns are significantly lower than nominal
      // Stock: (1.12 / 1.10) - 1 ≈ 0.0182 (1.82%)
      // Bond: (1.08 / 1.10) - 1 ≈ -0.0182 (-1.82%)
      // Cash: (1.06 / 1.10) - 1 ≈ -0.0364 (-3.64%)
      expect(returns.stocks).toBeCloseTo(1.12 / 1.1 - 1, 6);
      expect(returns.bonds).toBeCloseTo(1.08 / 1.1 - 1, 6);
      expect(returns.cash).toBeCloseTo(1.06 / 1.1 - 1, 6);
      expect(inflationRate).toBe(0.1);

      // Verify bonds and cash have negative real returns
      expect(returns.bonds).toBeLessThan(0);
      expect(returns.cash).toBeLessThan(0);
    });

    it('should handle extreme high inflation scenario (15%)', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockReturn: 15,
          bondReturn: 10,
          cashReturn: 8,
          inflationRate: 15,
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const { returns } = provider.getReturns(null);

      // Stock: (1.15 / 1.15) - 1 = 0 (0%)
      // Bond: (1.10 / 1.15) - 1 ≈ -0.0435 (-4.35%)
      // Cash: (1.08 / 1.15) - 1 ≈ -0.0609 (-6.09%)
      expect(returns.stocks).toBeCloseTo(0, 6);
      expect(returns.bonds).toBeCloseTo(1.1 / 1.15 - 1, 6);
      expect(returns.cash).toBeCloseTo(1.08 / 1.15 - 1, 6);
    });

    it('should handle deflation scenario (negative inflation)', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockReturn: 5,
          bondReturn: 3,
          cashReturn: 1,
          inflationRate: -2, // 2% deflation
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const { returns, inflationRate } = provider.getReturns(null);

      // With deflation, real returns are higher than nominal returns
      // Stock: (1.05 / 0.98) - 1 ≈ 0.0714 (7.14%)
      // Bond: (1.03 / 0.98) - 1 ≈ 0.0510 (5.10%)
      // Cash: (1.01 / 0.98) - 1 ≈ 0.0306 (3.06%)
      expect(returns.stocks).toBeCloseTo(1.05 / 0.98 - 1, 6);
      expect(returns.bonds).toBeCloseTo(1.03 / 0.98 - 1, 6);
      expect(returns.cash).toBeCloseTo(1.01 / 0.98 - 1, 6);
      expect(inflationRate).toBe(-0.02);

      // Verify all real returns are higher than nominal
      expect(returns.stocks).toBeGreaterThan(0.05);
      expect(returns.bonds).toBeGreaterThan(0.03);
      expect(returns.cash).toBeGreaterThan(0.01);
    });

    it('should handle zero inflation', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockReturn: 8,
          bondReturn: 4,
          cashReturn: 2,
          inflationRate: 0,
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const { returns, inflationRate } = provider.getReturns(null);

      // With zero inflation, real returns equal nominal returns
      // Stock: (1.08 / 1.0) - 1 = 0.08 (8%)
      // Bond: (1.04 / 1.0) - 1 = 0.04 (4%)
      // Cash: (1.02 / 1.0) - 1 = 0.02 (2%)
      expect(returns.stocks).toBeCloseTo(0.08, 6);
      expect(returns.bonds).toBeCloseTo(0.04, 6);
      expect(returns.cash).toBeCloseTo(0.02, 6);
      expect(inflationRate).toBe(0);
    });

    it('should return all values in decimal format', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockReturn: 10,
          bondReturn: 5,
          cashReturn: 3,
          inflationRate: 3,
          stockYield: 2.5,
          bondYield: 4.0,
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const result = provider.getReturns(null);

      // All fields should be decimals (less than 1 for typical rates)
      expect(Math.abs(result.inflationRate)).toBeLessThan(1);
      expect(Math.abs(result.yields.stocks)).toBeLessThan(1);
      expect(Math.abs(result.yields.bonds)).toBeLessThan(1);
      expect(Math.abs(result.yields.cash)).toBeLessThan(1);
    });

    it('should handle zero nominal returns with positive inflation', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockReturn: 0,
          bondReturn: 0,
          cashReturn: 0,
          inflationRate: 3,
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const { returns } = provider.getReturns(null);

      // All real returns should be negative (losing purchasing power)
      // real = (1.0 / 1.03) - 1 ≈ -0.0291 (-2.91%)
      const expectedRealReturn = 1 / 1.03 - 1;
      expect(returns.stocks).toBeCloseTo(expectedRealReturn, 6);
      expect(returns.bonds).toBeCloseTo(expectedRealReturn, 6);
      expect(returns.cash).toBeCloseTo(expectedRealReturn, 6);
    });

    it('should handle negative nominal returns', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockReturn: -10, // Market crash
          bondReturn: 2,
          cashReturn: 1,
          inflationRate: 3,
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const { returns } = provider.getReturns(null);

      // Stock: (0.90 / 1.03) - 1 ≈ -0.1262 (-12.62%)
      expect(returns.stocks).toBeCloseTo(0.9 / 1.03 - 1, 6);
      expect(returns.stocks).toBeLessThan(-0.1);

      // Bonds and cash should still be calculated correctly
      expect(returns.bonds).toBeCloseTo(1.02 / 1.03 - 1, 6);
      expect(returns.cash).toBeCloseTo(1.01 / 1.03 - 1, 6);
    });
  });

  describe('yield conversion', () => {
    it('should convert yield rates from percentage to decimal', () => {
      const inputs = createSimulatorInputs({
        marketAssumptions: {
          ...createDefaultMarketAssumptions(),
          stockYield: 2.5,
          bondYield: 4.0,
          cashReturn: 3.0, // Cash yield is cashReturn
        },
      });
      const provider = new FixedReturnsProvider(inputs);
      const { yields } = provider.getReturns(null);

      expect(yields.stocks).toBe(0.025);
      expect(yields.bonds).toBe(0.04);
      expect(yields.cash).toBe(0.03);
    });
  });

  describe('phase independence', () => {
    it('should return identical values regardless of simulation phase', () => {
      const inputs = createSimulatorInputs();
      const provider = new FixedReturnsProvider(inputs);

      const accumulation = provider.getReturns({ name: 'accumulation' });
      const retirement = provider.getReturns({ name: 'retirement' });
      const nullPhase = provider.getReturns(null);

      expect(accumulation.returns).toEqual(retirement.returns);
      expect(accumulation.returns).toEqual(nullPhase.returns);
      expect(accumulation.yields).toEqual(retirement.yields);
      expect(accumulation.inflationRate).toEqual(retirement.inflationRate);
    });
  });
});
