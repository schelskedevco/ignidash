import { describe, it, expect } from 'vitest';

import { SeededRandom } from './seeded-random';

describe('SeededRandom', () => {
  describe('reproducibility', () => {
    it('should produce identical sequences for the same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const seq1 = Array.from({ length: 100 }, () => rng1.next());
      const seq2 = Array.from({ length: 100 }, () => rng2.next());

      expect(seq1).toEqual(seq2);
    });

    it('should produce different sequences for different seeds', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(43);

      const seq1 = Array.from({ length: 20 }, () => rng1.next());
      const seq2 = Array.from({ length: 20 }, () => rng2.next());

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('edge cases', () => {
    it('should treat seed=0 as seed=1', () => {
      const rng0 = new SeededRandom(0);
      const rng1 = new SeededRandom(1);

      const seq0 = Array.from({ length: 10 }, () => rng0.next());
      const seq1 = Array.from({ length: 10 }, () => rng1.next());

      expect(seq0).toEqual(seq1);
    });

    it('should handle negative seeds by taking absolute value', () => {
      const rngNeg = new SeededRandom(-42);
      const rngPos = new SeededRandom(42);

      const seqNeg = Array.from({ length: 10 }, () => rngNeg.next());
      const seqPos = Array.from({ length: 10 }, () => rngPos.next());

      expect(seqNeg).toEqual(seqPos);
    });

    it('should handle very large seeds by modding into valid range', () => {
      const rng = new SeededRandom(Number.MAX_SAFE_INTEGER);
      const value = rng.next();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  describe('reset', () => {
    it('should reproduce the same sequence after reset with same seed', () => {
      const rng = new SeededRandom(42);
      const firstRun = Array.from({ length: 20 }, () => rng.next());

      rng.reset(42);
      const secondRun = Array.from({ length: 20 }, () => rng.next());

      expect(firstRun).toEqual(secondRun);
    });

    it('should produce a different sequence after reset with a different seed', () => {
      const rng = new SeededRandom(42);
      const firstRun = Array.from({ length: 20 }, () => rng.next());

      rng.reset(99);
      const secondRun = Array.from({ length: 20 }, () => rng.next());

      expect(firstRun).not.toEqual(secondRun);
    });
  });

  describe('next() range', () => {
    it('should produce values in [0, 1)', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 10000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('nextGaussian()', () => {
    it('should have mean approximately 0 over many samples', () => {
      const rng = new SeededRandom(42);
      const n = 10000;
      let sum = 0;

      for (let i = 0; i < n; i++) {
        sum += rng.nextGaussian();
      }

      const mean = sum / n;
      expect(mean).toBeCloseTo(0, 1); // within ~0.05 of 0
    });

    it('should have standard deviation approximately 1 over many samples', () => {
      const rng = new SeededRandom(42);
      const n = 10000;
      const values: number[] = [];

      for (let i = 0; i < n; i++) {
        values.push(rng.nextGaussian());
      }

      const mean = values.reduce((a, b) => a + b, 0) / n;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
      const std = Math.sqrt(variance);

      expect(std).toBeCloseTo(1, 1); // within ~0.05 of 1
    });
  });

  describe('nextGamma()', () => {
    it('should produce identical sequences for the same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const seq1 = Array.from({ length: 50 }, () => rng1.nextGamma(4, 2));
      const seq2 = Array.from({ length: 50 }, () => rng2.nextGamma(4, 2));

      expect(seq1).toEqual(seq2);
    });

    it('should converge to correct mean and variance for Gamma(4, 2)', () => {
      const rng = new SeededRandom(123);
      const n = 10000;
      const values: number[] = [];

      for (let i = 0; i < n; i++) {
        values.push(rng.nextGamma(4, 2));
      }

      const mean = values.reduce((a, b) => a + b, 0) / n;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;

      // Gamma(4, 2): mean = shape * scale = 8, variance = shape * scale^2 = 16
      expect(mean).toBeCloseTo(8, 0);
      expect(variance).toBeGreaterThan(14);
      expect(variance).toBeLessThan(18);
    });

    it('should produce only positive values', () => {
      const rng = new SeededRandom(42);

      for (let i = 0; i < 10000; i++) {
        const value = rng.nextGamma(4, 2);
        expect(value).toBeGreaterThan(0);
      }
    });

    it('should work for shape < 1 (Ahrens-Dieter boost)', () => {
      const rng = new SeededRandom(42);
      const n = 10000;
      const values: number[] = [];

      for (let i = 0; i < n; i++) {
        values.push(rng.nextGamma(0.5, 1));
      }

      const mean = values.reduce((a, b) => a + b, 0) / n;

      // Gamma(0.5, 1): mean = 0.5
      expect(mean).toBeCloseTo(0.5, 1);
      // All values should be positive
      expect(Math.min(...values)).toBeGreaterThan(0);
    });
  });

  describe('nextChiSquared()', () => {
    it('should produce identical sequences for the same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const seq1 = Array.from({ length: 50 }, () => rng1.nextChiSquared(8));
      const seq2 = Array.from({ length: 50 }, () => rng2.nextChiSquared(8));

      expect(seq1).toEqual(seq2);
    });

    it('should converge to correct mean and variance for Chi-squared(8)', () => {
      const rng = new SeededRandom(456);
      const n = 10000;
      const values: number[] = [];

      for (let i = 0; i < n; i++) {
        values.push(rng.nextChiSquared(8));
      }

      const mean = values.reduce((a, b) => a + b, 0) / n;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;

      // Chi-squared(8): mean = 8, variance = 2*df = 16
      expect(mean).toBeCloseTo(8, 0);
      expect(variance).toBeGreaterThan(14);
      expect(variance).toBeLessThan(18);
    });

    it('should produce only positive values', () => {
      const rng = new SeededRandom(42);

      for (let i = 0; i < 10000; i++) {
        const value = rng.nextChiSquared(8);
        expect(value).toBeGreaterThan(0);
      }
    });
  });
});
