import type { SimulationDataPoint, MultiSimulationResult, SimulationResult } from '@/lib/calc/v2/simulation-engine';

export interface Stats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number | null;
}

export interface Percentiles {
  p10: { seed: number; dp: SimulationDataPoint };
  p25: { seed: number; dp: SimulationDataPoint };
  p50: { seed: number; dp: SimulationDataPoint };
  p75: { seed: number; dp: SimulationDataPoint };
  p90: { seed: number; dp: SimulationDataPoint };
}

export interface MultiSimulationAnalysis {
  p10Result: SimulationResult;
  p25Result: SimulationResult;
  p50Result: SimulationResult;
  p75Result: SimulationResult;
  p90Result: SimulationResult;
}

export class MultiSimulationAnalyzer {
  analyze(multiSimulationResult: MultiSimulationResult): MultiSimulationAnalysis {
    const p10DataPoints: Array<SimulationDataPoint> = [];
    const p25DataPoints: Array<SimulationDataPoint> = [];
    const p50DataPoints: Array<SimulationDataPoint> = [];
    const p75DataPoints: Array<SimulationDataPoint> = [];
    const p90DataPoints: Array<SimulationDataPoint> = [];

    const simulations = multiSimulationResult.simulations;

    const numDataPoints = simulations[0][1]?.data.length;
    if (!numDataPoints) throw new Error('No data points in simulations');

    for (let i = 0; i < numDataPoints; i++) {
      const dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }> = [];

      for (const [seed, simResult] of simulations) {
        const dataPoint = simResult.data[i];
        dataPointsForYear.push({ seed, dp: dataPoint });
      }

      const sortedDataPointsForYear = dataPointsForYear.sort((a, b) => a.dp.portfolio.totalValue - b.dp.portfolio.totalValue);
      const percentiles = this.calculatePercentilesFromValues(sortedDataPointsForYear);

      p10DataPoints.push(percentiles.p10.dp);
      p25DataPoints.push(percentiles.p25.dp);
      p50DataPoints.push(percentiles.p50.dp);
      p75DataPoints.push(percentiles.p75.dp);
      p90DataPoints.push(percentiles.p90.dp);
    }

    const context = { ...simulations[0][1].context };

    return {
      p10Result: { data: p10DataPoints, context },
      p25Result: { data: p25DataPoints, context },
      p50Result: { data: p50DataPoints, context },
      p75Result: { data: p75DataPoints, context },
      p90Result: { data: p90DataPoints, context },
    };
  }

  private calculateStats(values: number[]): Stats | null {
    if (values.length === 0) return null;
    if (values.length === 1) return { mean: values[0], median: values[0], min: values[0], max: values[0], stdDev: null };

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = this.calculateMedian(sorted);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const stdDev = this.calculateStandardDeviation(values, mean);

    return { mean, median, min, max, stdDev };
  }

  private calculateMedian(sortedValues: number[]): number {
    const length = sortedValues.length;
    if (length % 2 === 0) {
      return (sortedValues[length / 2 - 1] + sortedValues[length / 2]) / 2;
    } else {
      return sortedValues[Math.floor(length / 2)];
    }
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private calculatePercentile(
    sortedValues: Array<{ seed: number; dp: SimulationDataPoint }>,
    percentile: number
  ): { seed: number; dp: SimulationDataPoint } {
    const index = Math.floor((percentile / 100) * sortedValues.length);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  }

  private calculatePercentilesFromValues(sortedValues: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles {
    return {
      p10: this.calculatePercentile(sortedValues, 10),
      p25: this.calculatePercentile(sortedValues, 25),
      p50: this.calculatePercentile(sortedValues, 50),
      p75: this.calculatePercentile(sortedValues, 75),
      p90: this.calculatePercentile(sortedValues, 90),
    };
  }
}
