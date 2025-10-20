export interface Stats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number | null;
}

export interface Percentiles<T> {
  p10: T;
  p25: T;
  p50: T;
  p75: T;
  p90: T;
}

export class StatsUtils {
  static getRange<T>(data: T[], extractor: (row: T) => number | null): { min: number; max: number; range: number } {
    const values = data.map(extractor).filter((v): v is number => v !== null);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { min, max, range: max - min };
  }

  static normalize(value: number | null, min: number, range: number, fallback: number = 0, invert: boolean = false): number {
    if (value === null) return fallback;
    if (range === 0) return 0.5;

    let norm = (value - min) / range;
    if (invert) norm = 1 - norm;

    return Math.max(0, Math.min(1, norm));
  }

  static mean(values: number[]): number {
    if (values.length === 0) return -1;

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static standardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;

    const avg = this.mean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);

    return Math.sqrt(variance);
  }

  static minFromSorted(sortedValues: number[]): number {
    if (sortedValues.length === 0) return -1;
    return sortedValues[0];
  }

  static maxFromSorted(sortedValues: number[]): number {
    if (sortedValues.length === 0) return -1;
    return sortedValues[sortedValues.length - 1];
  }

  static calculatePercentile<T>(sortedValues: T[], percentile: number): T {
    const index = Math.floor((percentile / 100) * sortedValues.length);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  }

  static calculatePercentilesFromValues<T>(sortedValues: T[]): Percentiles<T> {
    return {
      p10: this.calculatePercentile(sortedValues, 10),
      p25: this.calculatePercentile(sortedValues, 25),
      p50: this.calculatePercentile(sortedValues, 50),
      p75: this.calculatePercentile(sortedValues, 75),
      p90: this.calculatePercentile(sortedValues, 90),
    };
  }
}
