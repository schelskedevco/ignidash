import { describe, it, expect } from 'vitest';

import { HistoricalBacktestReturnsProvider } from './historical-backtest-returns-provider';
import { getNyuDataRange } from './data/nyu-historical-data';

describe('HistoricalBacktestReturnsProvider', () => {
  const dataRange = getNyuDataRange();

  describe('constructor validation', () => {
    it('should accept all valid start years (1928-2024)', () => {
      for (let year = dataRange.startYear; year <= dataRange.endYear; year++) {
        expect(() => new HistoricalBacktestReturnsProvider(year)).not.toThrow();
      }
    });

    it('should reject start years outside data range', () => {
      expect(() => new HistoricalBacktestReturnsProvider(dataRange.startYear - 1)).toThrow(/Start year .* is outside available data range/);
      expect(() => new HistoricalBacktestReturnsProvider(dataRange.endYear + 1)).toThrow(/Start year .* is outside available data range/);
    });
  });

  describe('getReturns basic functionality', () => {
    it('should return consistent results for same inputs', () => {
      const provider1 = new HistoricalBacktestReturnsProvider(1970);
      const provider2 = new HistoricalBacktestReturnsProvider(1970);

      const result1 = provider1.getReturns(1);
      const result2 = provider2.getReturns(1);

      expect(result1.returns.stocks).toBe(result2.returns.stocks);
      expect(result1.returns.bonds).toBe(result2.returns.bonds);
      expect(result1.returns.cash).toBe(result2.returns.cash);
      expect(result1.metadata.inflationRate).toBe(result2.metadata.inflationRate);
    });

    it('should return valid return data structure', () => {
      const provider = new HistoricalBacktestReturnsProvider(1980);
      const result = provider.getReturns(1);

      expect(result.returns).toHaveProperty('stocks');
      expect(result.returns).toHaveProperty('bonds');
      expect(result.returns).toHaveProperty('cash');
      expect(result.metadata).toHaveProperty('inflationRate');
      expect(result.metadata).toHaveProperty('extras');

      expect(typeof result.returns.stocks).toBe('number');
      expect(typeof result.returns.bonds).toBe('number');
      expect(typeof result.returns.cash).toBe('number');
      expect(typeof result.metadata.inflationRate).toBe('number');
    });

    it('should include correct extras metadata', () => {
      const startYear = 1985;
      const provider = new HistoricalBacktestReturnsProvider(startYear);
      const result = provider.getReturns(3); // Simulation year 3

      expect(result.metadata.extras).toBeDefined();
      expect(result.metadata.extras!.historicalYear).toBe(1987); // 1985 + 3 - 1
      expect(result.metadata.extras!.originalStartYear).toBe(startYear);
      expect(result.metadata.extras!.simulationYear).toBe(3);
    });
  });

  describe('historical year progression', () => {
    it('should progress through years sequentially', () => {
      const startYear = 1950;
      const provider = new HistoricalBacktestReturnsProvider(startYear);

      const year1 = provider.getReturns(1);
      const year2 = provider.getReturns(2);
      const year3 = provider.getReturns(3);

      expect(year1.metadata.extras!.historicalYear).toBe(1950);
      expect(year2.metadata.extras!.historicalYear).toBe(1951);
      expect(year3.metadata.extras!.historicalYear).toBe(1952);
    });

    it('should handle different start years correctly', () => {
      const provider1928 = new HistoricalBacktestReturnsProvider(1928);
      const provider2000 = new HistoricalBacktestReturnsProvider(2000);

      const result1928 = provider1928.getReturns(1);
      const result2000 = provider2000.getReturns(1);

      expect(result1928.metadata.extras!.historicalYear).toBe(1928);
      expect(result2000.metadata.extras!.historicalYear).toBe(2000);

      // Different years should generally have different returns
      expect(result1928.returns.stocks).not.toBe(result2000.returns.stocks);
    });
  });

  describe('looping behavior', () => {
    it('should loop back to beginning when exceeding available data', () => {
      const startYear = 2020; // Near end of data range
      const provider = new HistoricalBacktestReturnsProvider(startYear);

      // Get returns for many years to force looping
      const totalYears = dataRange.endYear - dataRange.startYear + 1;
      const yearsPastEnd = 10;
      const simulationYear = totalYears - (startYear - dataRange.startYear) + yearsPastEnd;

      const result = provider.getReturns(simulationYear);

      // Should have looped back to early years
      const expectedHistoricalYear = dataRange.startYear + yearsPastEnd - 1;
      expect(result.metadata.extras!.historicalYear).toBe(expectedHistoricalYear);
    });

    it('should maintain consistency across multiple loops', () => {
      const provider = new HistoricalBacktestReturnsProvider(1928);
      const totalYears = dataRange.endYear - dataRange.startYear + 1;

      // Get returns for first year of data
      const firstYear = provider.getReturns(1);

      // Get returns for first year after one complete loop
      const afterOneLoop = provider.getReturns(totalYears + 1);

      // Should be identical since we've looped back
      expect(firstYear.returns.stocks).toBe(afterOneLoop.returns.stocks);
      expect(firstYear.returns.bonds).toBe(afterOneLoop.returns.bonds);
      expect(firstYear.returns.cash).toBe(afterOneLoop.returns.cash);
      expect(firstYear.metadata.inflationRate).toBe(afterOneLoop.metadata.inflationRate);
    });

    it('should handle edge case of starting at last year', () => {
      const provider = new HistoricalBacktestReturnsProvider(dataRange.endYear);

      const year1 = provider.getReturns(1); // Should be 2024
      const year2 = provider.getReturns(2); // Should loop to 1928

      expect(year1.metadata.extras!.historicalYear).toBe(dataRange.endYear);
      expect(year2.metadata.extras!.historicalYear).toBe(dataRange.startYear);
    });
  });

  describe('data integrity', () => {
    it('should return actual historical data, not synthetic values', () => {
      // Test a few known historical periods
      const provider1929 = new HistoricalBacktestReturnsProvider(1929); // Great Depression
      const provider2008 = new HistoricalBacktestReturnsProvider(2008); // Financial Crisis

      const crash1929 = provider1929.getReturns(2); // 1930 (year after crash)
      const crisis2008 = provider2008.getReturns(1); // 2008

      // 1930 had negative stock returns due to Great Depression
      expect(crash1929.returns.stocks).toBeLessThan(0);

      // 2008 had significant negative stock returns due to financial crisis
      expect(crisis2008.returns.stocks).toBeLessThan(-0.3); // Less than -30%
    });

    it('should maintain return bounds within reasonable historical ranges', () => {
      const provider = new HistoricalBacktestReturnsProvider(1950);

      // Test several years to get a range of values
      for (let year = 1; year <= 10; year++) {
        const result = provider.getReturns(year);

        // Stock returns should be within extreme historical bounds
        expect(result.returns.stocks).toBeGreaterThan(-1); // No -100% years
        expect(result.returns.stocks).toBeLessThan(1); // No 100%+ years in modern data

        // Bond and cash returns should be more constrained
        expect(result.returns.bonds).toBeGreaterThan(-0.5); // Bonds rarely lose 50%+
        expect(result.returns.cash).toBeGreaterThan(-0.2); // Cash is relatively stable

        // Inflation should be within historical bounds
        expect(result.metadata.inflationRate).toBeGreaterThan(-20); // -20% deflation max
        expect(result.metadata.inflationRate).toBeLessThan(20); // 20% inflation max
      }
    });
  });
});
