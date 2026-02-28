import { describe, it, expect } from 'vitest';
import { StatsUtils } from './stats-utils';

describe('StatsUtils', () => {
  describe('mean', () => {
    it('should return -1 for empty array', () => {
      expect(StatsUtils.mean([])).toBe(-1);
    });

    it('should return the value for a single element', () => {
      expect(StatsUtils.mean([5])).toBe(5);
    });

    it('should calculate mean correctly', () => {
      expect(StatsUtils.mean([2, 4, 6])).toBe(4);
      expect(StatsUtils.mean([10, 20, 30, 40])).toBe(25);
    });
  });

  describe('standardDeviation', () => {
    it('should return 0 for empty array', () => {
      expect(StatsUtils.standardDeviation([])).toBe(0);
    });

    it('should return 0 for single element', () => {
      expect(StatsUtils.standardDeviation([42])).toBe(0);
    });

    it('should calculate sample standard deviation correctly', () => {
      // Known values: [2, 4, 4, 4, 5, 5, 7, 9] → sample std dev ≈ 2.138
      const result = StatsUtils.standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(result).toBeCloseTo(2.138, 2);
    });

    it('should return 0 for identical values', () => {
      expect(StatsUtils.standardDeviation([5, 5, 5, 5])).toBe(0);
    });
  });

  describe('getRange', () => {
    it('should extract range from objects', () => {
      const data = [{ v: 10 }, { v: 20 }, { v: 5 }];
      const result = StatsUtils.getRange(data, (d) => d.v);
      expect(result).toEqual({ min: 5, max: 20, range: 15 });
    });

    it('should skip null values', () => {
      const data = [{ v: 10 as number | null }, { v: null }, { v: 30 }];
      const result = StatsUtils.getRange(data, (d) => d.v);
      expect(result).toEqual({ min: 10, max: 30, range: 20 });
    });
  });

  describe('normalize', () => {
    it('should return fallback for null', () => {
      expect(StatsUtils.normalize(null, 0, 100)).toBe(0);
      expect(StatsUtils.normalize(null, 0, 100, 0.5)).toBe(0.5);
    });

    it('should return 0.5 when range is 0', () => {
      expect(StatsUtils.normalize(50, 50, 0)).toBe(0.5);
    });

    it('should normalize to 0-1 range', () => {
      expect(StatsUtils.normalize(0, 0, 100)).toBe(0);
      expect(StatsUtils.normalize(50, 0, 100)).toBe(0.5);
      expect(StatsUtils.normalize(100, 0, 100)).toBe(1);
    });

    it('should clamp to 0-1', () => {
      expect(StatsUtils.normalize(-10, 0, 100)).toBe(0);
      expect(StatsUtils.normalize(200, 0, 100)).toBe(1);
    });

    it('should invert when flag is set', () => {
      expect(StatsUtils.normalize(0, 0, 100, 0, true)).toBe(1);
      expect(StatsUtils.normalize(100, 0, 100, 0, true)).toBe(0);
      expect(StatsUtils.normalize(75, 0, 100, 0, true)).toBe(0.25);
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentile from sorted array', () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(StatsUtils.calculatePercentile(sorted, 50)).toBe(6);
      expect(StatsUtils.calculatePercentile(sorted, 0)).toBe(1);
      expect(StatsUtils.calculatePercentile(sorted, 100)).toBe(10);
    });
  });

  describe('calculatePercentilesFromValues', () => {
    it('should return all percentile buckets', () => {
      const sorted = Array.from({ length: 100 }, (_, i) => i + 1);
      const result = StatsUtils.calculatePercentilesFromValues(sorted);

      expect(result.p10).toBe(11);
      expect(result.p25).toBe(26);
      expect(result.p50).toBe(51);
      expect(result.p75).toBe(76);
      expect(result.p90).toBe(91);
    });
  });

  describe('minFromSorted / maxFromSorted', () => {
    it('should return -1 for empty arrays', () => {
      expect(StatsUtils.minFromSorted([])).toBe(-1);
      expect(StatsUtils.maxFromSorted([])).toBe(-1);
    });

    it('should return first/last element', () => {
      const sorted = [3, 5, 10];
      expect(StatsUtils.minFromSorted(sorted)).toBe(3);
      expect(StatsUtils.maxFromSorted(sorted)).toBe(10);
    });
  });
});
