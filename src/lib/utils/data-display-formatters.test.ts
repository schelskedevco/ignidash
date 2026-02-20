import { describe, it, expect } from 'vitest';
import { compareTimePoints } from './data-display-formatters';
import type { TimePoint } from '@/lib/schemas/inputs/income-expenses-shared-schemas';

const now: TimePoint = { type: 'now' };
const atRetirement: TimePoint = { type: 'atRetirement' };
const atLifeExpectancy: TimePoint = { type: 'atLifeExpectancy' };
const date = (year: number, month: number): TimePoint => ({ type: 'customDate', year, month });
const age = (a: number): TimePoint => ({ type: 'customAge', age: a });

describe('compareTimePoints', () => {
  it('treats two "now" as equal', () => {
    expect(compareTimePoints(now, now)).toBe(0);
  });

  it('treats two identical customDate as equal', () => {
    expect(compareTimePoints(date(2030, 6), date(2030, 6))).toBe(0);
  });

  it('treats two identical customAge as equal', () => {
    expect(compareTimePoints(age(65), age(65))).toBe(0);
  });

  describe('cross-type rank ordering', () => {
    it('now < customDate', () => {
      expect(compareTimePoints(now, date(2030, 1))).toBeLessThan(0);
    });

    it('now < customAge', () => {
      expect(compareTimePoints(now, age(40))).toBeLessThan(0);
    });

    it('now < atRetirement', () => {
      expect(compareTimePoints(now, atRetirement)).toBeLessThan(0);
    });

    it('now < atLifeExpectancy', () => {
      expect(compareTimePoints(now, atLifeExpectancy)).toBeLessThan(0);
    });

    it('customDate < atRetirement', () => {
      expect(compareTimePoints(date(2030, 1), atRetirement)).toBeLessThan(0);
    });

    it('customAge < atRetirement', () => {
      expect(compareTimePoints(age(50), atRetirement)).toBeLessThan(0);
    });

    it('atRetirement < atLifeExpectancy', () => {
      expect(compareTimePoints(atRetirement, atLifeExpectancy)).toBeLessThan(0);
    });

    it('atLifeExpectancy > now (reverse direction)', () => {
      expect(compareTimePoints(atLifeExpectancy, now)).toBeGreaterThan(0);
    });
  });

  describe('customDate sub-sorting', () => {
    it('sorts by year', () => {
      expect(compareTimePoints(date(2025, 1), date(2030, 1))).toBeLessThan(0);
      expect(compareTimePoints(date(2030, 1), date(2025, 1))).toBeGreaterThan(0);
    });

    it('sorts by month within same year', () => {
      expect(compareTimePoints(date(2030, 3), date(2030, 9))).toBeLessThan(0);
      expect(compareTimePoints(date(2030, 9), date(2030, 3))).toBeGreaterThan(0);
    });
  });

  describe('customAge sub-sorting', () => {
    it('sorts by age', () => {
      expect(compareTimePoints(age(40), age(65))).toBeLessThan(0);
      expect(compareTimePoints(age(65), age(40))).toBeGreaterThan(0);
    });
  });

  describe('customDate vs customAge tiebreaker', () => {
    it('customDate sorts before customAge at same rank', () => {
      expect(compareTimePoints(date(2030, 1), age(50))).toBeLessThan(0);
      expect(compareTimePoints(age(50), date(2030, 1))).toBeGreaterThan(0);
    });
  });

  describe('mixed array sort', () => {
    it('sorts a realistic array of TimePoints correctly', () => {
      const input: TimePoint[] = [atLifeExpectancy, age(65), date(2028, 6), now, atRetirement, date(2025, 1), age(40), date(2028, 1)];

      const sorted = [...input].sort(compareTimePoints);

      expect(sorted).toEqual([now, date(2025, 1), date(2028, 1), date(2028, 6), age(40), age(65), atRetirement, atLifeExpectancy]);
    });
  });
});
