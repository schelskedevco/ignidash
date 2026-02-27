import { describe, it, expect } from 'vitest';

import { LcgHistoricalBacktestReturnsProvider } from './lcg-historical-backtest-returns-provider';
import { getNyuDataRange, nyuHistoricalData } from '../historical-data/nyu-historical-data';
import type { PhaseData } from '../phase';

describe('LcgHistoricalBacktestReturnsProvider', () => {
  const dataRange = getNyuDataRange();
  const phaseData: PhaseData = {
    name: 'accumulation',
  };

  describe('core functionality', () => {
    it('should return exact NYU historical data for the selected year', () => {
      // Find a provider that starts at 1929 (known data)
      let provider: LcgHistoricalBacktestReturnsProvider | null = null;

      for (let seed = 1; seed < 1000; seed++) {
        const testProvider = new LcgHistoricalBacktestReturnsProvider(seed, undefined, undefined);
        const historicalRanges = testProvider.getHistoricalRanges();
        const startYear = historicalRanges[0].startYear;

        if (startYear === 1929) {
          provider = testProvider;
          break;
        }
      }

      expect(provider).not.toBeNull();
      const result = provider!.getReturns(phaseData);

      // Get the expected data for 1929
      const expectedData = nyuHistoricalData.find((d) => d.year === 1929)!;

      // Verify exact match with NYU historical data
      expect(result.returns.stocks).toBe(expectedData.stockReturn);
      expect(result.returns.bonds).toBe(expectedData.bondReturn);
      expect(result.returns.cash).toBe(expectedData.cashReturn);
      expect(result.inflationRate).toBeCloseTo(expectedData.inflationRate * 100, 10); // Converted to percentage
    });

    it('should produce consistent results with same seed', () => {
      const provider1 = new LcgHistoricalBacktestReturnsProvider(42, undefined, undefined);
      const provider2 = new LcgHistoricalBacktestReturnsProvider(42, undefined, undefined);

      const result1 = provider1.getReturns(phaseData);
      const result2 = provider2.getReturns(phaseData);

      const historicalRanges1 = provider1.getHistoricalRanges();
      const historicalRanges2 = provider2.getHistoricalRanges();
      expect(historicalRanges1[0].startYear).toBe(historicalRanges2[0].startYear);
      expect(result1.returns.stocks).toBe(result2.returns.stocks);
    });
  });

  describe('different scenarios via new instances', () => {
    it('should generate different start years for different scenario seeds', () => {
      const baseSeed = 54321;

      // Create providers for different scenarios
      const provider1 = new LcgHistoricalBacktestReturnsProvider(baseSeed + 1 * 1009, undefined, undefined);
      const provider2 = new LcgHistoricalBacktestReturnsProvider(baseSeed + 2 * 1009, undefined, undefined);
      const provider3 = new LcgHistoricalBacktestReturnsProvider(baseSeed + 3 * 1009, undefined, undefined);

      const historicalRanges1 = provider1.getHistoricalRanges();
      const historicalRanges2 = provider2.getHistoricalRanges();
      const historicalRanges3 = provider3.getHistoricalRanges();

      const startYear1 = historicalRanges1[0].startYear;
      const startYear2 = historicalRanges2[0].startYear;
      const startYear3 = historicalRanges3[0].startYear;

      // Different seeds should generally produce different start years
      expect(startYear1).not.toBe(startYear2);
      expect(startYear2).not.toBe(startYear3);
      expect(startYear1).not.toBe(startYear3);

      // All should be valid years
      expect(startYear1).toBeGreaterThanOrEqual(dataRange.startYear);
      expect(startYear1).toBeLessThanOrEqual(dataRange.endYear);
      expect(startYear2).toBeGreaterThanOrEqual(dataRange.startYear);
      expect(startYear2).toBeLessThanOrEqual(dataRange.endYear);
      expect(startYear3).toBeGreaterThanOrEqual(dataRange.startYear);
      expect(startYear3).toBeLessThanOrEqual(dataRange.endYear);
    });
  });

  describe('startYearOverride', () => {
    it('should use the override instead of a random start year', () => {
      const provider = new LcgHistoricalBacktestReturnsProvider(42, 1950, undefined);
      const ranges = provider.getHistoricalRanges();
      expect(ranges[0].startYear).toBe(1950);

      const result = provider.getReturns(phaseData);
      const expectedData = nyuHistoricalData.find((d) => d.year === 1950)!;
      expect(result.returns.stocks).toBe(expectedData.stockReturn);
    });
  });

  describe('retirementStartYearOverride', () => {
    const accumulationPhase: PhaseData = { name: 'accumulation' };
    const retirementPhase: PhaseData = { name: 'retirement' };

    it('should reset to the override year when entering retirement', () => {
      const provider = new LcgHistoricalBacktestReturnsProvider(42, 1950, 1980);

      // Accumulation phase — starts at 1950
      provider.getReturns(accumulationPhase);
      const rangesBeforeRetirement = provider.getHistoricalRanges();
      expect(rangesBeforeRetirement).toHaveLength(1);
      expect(rangesBeforeRetirement[0].startYear).toBe(1950);

      // Transition to retirement — should reset to 1980
      provider.getReturns(retirementPhase);
      const rangesAfterRetirement = provider.getHistoricalRanges();
      expect(rangesAfterRetirement).toHaveLength(2);
      expect(rangesAfterRetirement[1].startYear).toBe(1980);
      expect(rangesAfterRetirement[1].endYear).toBe(1980);
    });

    it('should only reset once on the first retirement call', () => {
      const provider = new LcgHistoricalBacktestReturnsProvider(42, 1950, 1980);

      provider.getReturns(accumulationPhase); // year 1950
      provider.getReturns(retirementPhase); // resets to 1980
      provider.getReturns(retirementPhase); // should continue to 1981, not reset again

      const ranges = provider.getHistoricalRanges();
      expect(ranges).toHaveLength(2);
      expect(ranges[1].startYear).toBe(1980);
      expect(ranges[1].endYear).toBe(1981);
    });

    it('should not reset if retirementStartYearOverride is undefined', () => {
      const provider = new LcgHistoricalBacktestReturnsProvider(42, 1950, undefined);

      provider.getReturns(accumulationPhase);
      provider.getReturns(retirementPhase);

      const ranges = provider.getHistoricalRanges();
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startYear).toBe(1950);
      expect(ranges[0].endYear).toBe(1951);
    });

    it('should return correct historical data after retirement reset', () => {
      const provider = new LcgHistoricalBacktestReturnsProvider(42, 1950, 2000);

      provider.getReturns(accumulationPhase); // consumes 1950
      const result = provider.getReturns(retirementPhase); // resets to 2000

      const expectedData = nyuHistoricalData.find((d) => d.year === 2000)!;
      expect(result.returns.stocks).toBe(expectedData.stockReturn);
      expect(result.returns.bonds).toBe(expectedData.bondReturn);
    });
  });

  describe('edge cases', () => {
    it('should correctly handle starting at 1928', () => {
      // Find a seed that selects 1928
      let provider: LcgHistoricalBacktestReturnsProvider | null = null;

      for (let seed = 1; seed < 1000; seed++) {
        const testProvider = new LcgHistoricalBacktestReturnsProvider(seed, undefined, undefined);
        const historicalRanges = testProvider.getHistoricalRanges();
        const startYear = historicalRanges[0].startYear;

        if (startYear === 1928) {
          provider = testProvider;
          break;
        }
      }

      expect(provider).not.toBeNull();
      provider!.getReturns(phaseData);
      const historicalRanges1 = provider!.getHistoricalRanges();
      expect(historicalRanges1[0].startYear).toBe(1928);
      expect(historicalRanges1[0].endYear).toBe(1928);

      // Year 2 should progress to 1929
      provider!.getReturns(phaseData);
      const historicalRanges2 = provider!.getHistoricalRanges();
      expect(historicalRanges2[0].startYear).toBe(1928);
      expect(historicalRanges2[0].endYear).toBe(1929);
    });

    it('should correctly handle starting at 2024 and looping', () => {
      // Find a seed that selects 2024
      let provider: LcgHistoricalBacktestReturnsProvider | null = null;

      for (let seed = 1; seed < 1000; seed++) {
        const testProvider = new LcgHistoricalBacktestReturnsProvider(seed, undefined, undefined);
        const historicalRanges = testProvider.getHistoricalRanges();
        const startYear = historicalRanges[0].startYear;

        if (startYear === 2024) {
          provider = testProvider;
          break;
        }
      }

      expect(provider).not.toBeNull();
      provider!.getReturns(phaseData);
      const historicalRanges1 = provider!.getHistoricalRanges();
      expect(historicalRanges1[0].startYear).toBe(2024);
      expect(historicalRanges1[0].endYear).toBe(2024);

      // Year 2 should trigger a loop
      provider!.getReturns(phaseData);
      const historicalRanges2 = provider!.getHistoricalRanges();
      expect(historicalRanges2[1].startYear).toBe(1928); // Should have looped
    });
  });
});
