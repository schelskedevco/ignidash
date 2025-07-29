import { describe, it, expect } from 'vitest';

import { LcgHistoricalBacktestReturnsProvider } from './lcg-historical-backtest-returns-provider';
import { getNyuDataRange, nyuHistoricalData } from './data/nyu-historical-data';

describe('LcgHistoricalBacktestReturnsProvider', () => {
  const dataRange = getNyuDataRange();

  describe('core functionality', () => {
    it('should return exact NYU historical data for the selected year', () => {
      // Find a provider that starts at 1929 (known data)
      let provider: LcgHistoricalBacktestReturnsProvider | null = null;

      for (let seed = 1; seed < 1000; seed++) {
        const testProvider = new LcgHistoricalBacktestReturnsProvider(seed);
        if (testProvider.getReturns(1).metadata.extras!.selectedStartYear === 1929) {
          provider = testProvider;
          break;
        }
      }

      expect(provider).not.toBeNull();
      const result = provider!.getReturns(1);

      // Get the expected data for 1929
      const expectedData = nyuHistoricalData.find((d) => d.year === 1929)!;

      // Verify exact match with NYU historical data
      expect(result.returns.stocks).toBe(expectedData.stockReturn);
      expect(result.returns.bonds).toBe(expectedData.bondReturn);
      expect(result.returns.cash).toBe(expectedData.cashReturn);
      expect(result.metadata.inflationRate).toBeCloseTo(expectedData.inflationRate * 100, 10); // Converted to percentage
    });

    it('should produce consistent results with same seed', () => {
      const provider1 = new LcgHistoricalBacktestReturnsProvider(42);
      const provider2 = new LcgHistoricalBacktestReturnsProvider(42);

      const result1 = provider1.getReturns(1);
      const result2 = provider2.getReturns(1);

      expect(result1.metadata.extras!.selectedStartYear).toBe(result2.metadata.extras!.selectedStartYear);
      expect(result1.returns.stocks).toBe(result2.returns.stocks);
    });

    it('should loop to a random year when exceeding data range and continue sequentially', () => {
      // Find a provider that starts near the end
      let provider: LcgHistoricalBacktestReturnsProvider | null = null;

      for (let seed = 1; seed < 1000; seed++) {
        const testProvider = new LcgHistoricalBacktestReturnsProvider(seed);
        const startYear = testProvider.getReturns(1).metadata.extras!.selectedStartYear as number;

        if (startYear >= 2020) {
          provider = testProvider;
          break;
        }
      }

      expect(provider).not.toBeNull();
      const startYear = provider!.getReturns(1).metadata.extras!.selectedStartYear as number;
      const yearsUntilEnd = dataRange.endYear - startYear + 1;

      // Get year right at the end
      const lastYearBeforeLoop = provider!.getReturns(yearsUntilEnd);
      expect(lastYearBeforeLoop.metadata.extras!.historicalYear).toBe(dataRange.endYear);

      // Next year should loop to a random year
      const firstYearAfterLoop = provider!.getReturns(yearsUntilEnd + 1);
      const loopedYear = firstYearAfterLoop.metadata.extras!.historicalYear as number;

      // Should be a valid year
      expect(loopedYear).toBeGreaterThanOrEqual(dataRange.startYear);
      expect(loopedYear).toBeLessThanOrEqual(dataRange.endYear);

      // Next year should continue sequentially from the looped year
      const secondYearAfterLoop = provider!.getReturns(yearsUntilEnd + 2);
      expect(secondYearAfterLoop.metadata.extras!.historicalYear).toBe(
        loopedYear < dataRange.endYear ? loopedYear + 1 : dataRange.startYear
      );
    });
  });

  describe('different scenarios via new instances', () => {
    it('should generate different start years for different scenario seeds', () => {
      const baseSeed = 54321;

      // Create providers for different scenarios
      const provider1 = new LcgHistoricalBacktestReturnsProvider(baseSeed + 1 * 1009);
      const provider2 = new LcgHistoricalBacktestReturnsProvider(baseSeed + 2 * 1009);
      const provider3 = new LcgHistoricalBacktestReturnsProvider(baseSeed + 3 * 1009);

      const result1 = provider1.getReturns(1);
      const result2 = provider2.getReturns(1);
      const result3 = provider3.getReturns(1);

      const startYear1 = result1.metadata.extras!.selectedStartYear as number;
      const startYear2 = result2.metadata.extras!.selectedStartYear as number;
      const startYear3 = result3.metadata.extras!.selectedStartYear as number;

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

  describe('edge cases', () => {
    it('should correctly handle starting at 1928', () => {
      // Find a seed that selects 1928
      let provider: LcgHistoricalBacktestReturnsProvider | null = null;

      for (let seed = 1; seed < 1000; seed++) {
        const testProvider = new LcgHistoricalBacktestReturnsProvider(seed);
        if (testProvider.getReturns(1).metadata.extras!.selectedStartYear === 1928) {
          provider = testProvider;
          break;
        }
      }

      expect(provider).not.toBeNull();
      const result = provider!.getReturns(1);
      expect(result.metadata.extras!.historicalYear).toBe(1928);
      expect(result.metadata.extras!.selectedStartYear).toBe(1928);

      // Year 2 should progress to 1929
      const year2 = provider!.getReturns(2);
      expect(year2.metadata.extras!.historicalYear).toBe(1929);
    });

    it('should correctly handle starting at 2024 and looping', () => {
      // Find a seed that selects 2024
      let provider: LcgHistoricalBacktestReturnsProvider | null = null;

      for (let seed = 1; seed < 1000; seed++) {
        const testProvider = new LcgHistoricalBacktestReturnsProvider(seed);
        if (testProvider.getReturns(1).metadata.extras!.selectedStartYear === 2024) {
          provider = testProvider;
          break;
        }
      }

      expect(provider).not.toBeNull();
      const result = provider!.getReturns(1);
      expect(result.metadata.extras!.historicalYear).toBe(2024);
      expect(result.metadata.extras!.selectedStartYear).toBe(2024);

      // Year 2 should trigger a loop
      const year2 = provider!.getReturns(2);
      expect(year2.metadata.extras!.historicalYear).not.toBe(2025); // Should have looped
      expect(year2.metadata.extras!.historicalYear).not.toBe(2024); // Should not stay at 2024
      expect(year2.metadata.extras!.historicalYear).toBeGreaterThanOrEqual(dataRange.startYear);
      expect(year2.metadata.extras!.historicalYear).toBeLessThanOrEqual(dataRange.endYear);
    });
  });
});
