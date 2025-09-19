import { ReturnsProvider, ReturnsWithMetadata } from './returns-provider';
import { nyuHistoricalData, NyuHistoricalYearData, getNyuDataRange } from '../data/nyu-historical-data';
import { AssetReturnRates } from '../asset';
import { SeededRandom } from './seeded-random';

export class LcgHistoricalBacktestReturnsProvider implements ReturnsProvider {
  private dataRange: { startYear: number; endYear: number };
  private historicalData: NyuHistoricalYearData[];
  private rng: SeededRandom;
  private selectedStartYear: number;
  private currentSequenceStartYear: number;
  private currentSequenceStartSimYear: number;
  private historicalRanges: Array<{ startYear: number; endYear: number }> = [];

  constructor(seed: number) {
    this.dataRange = getNyuDataRange();
    this.historicalData = nyuHistoricalData;
    this.rng = new SeededRandom(seed);
    this.selectedStartYear = this.generateRandomStartYear();
    this.currentSequenceStartYear = this.selectedStartYear;
    this.currentSequenceStartSimYear = 1;
    this.historicalRanges = [{ startYear: this.selectedStartYear, endYear: this.selectedStartYear }];
  }

  private generateRandomStartYear(): number {
    const yearRange = this.dataRange.endYear - this.dataRange.startYear + 1;
    const randomOffset = Math.floor(this.rng.next() * yearRange);
    return this.dataRange.startYear + randomOffset;
  }

  getReturns(simulationYear: number): ReturnsWithMetadata {
    const yearsIntoSequence = simulationYear - this.currentSequenceStartSimYear;
    const targetHistoricalYear = this.currentSequenceStartYear + yearsIntoSequence;

    let adjustedYear: number;
    if (targetHistoricalYear <= this.dataRange.endYear) {
      adjustedYear = targetHistoricalYear;
      const currentRange = this.historicalRanges[this.historicalRanges.length - 1];
      currentRange.endYear = adjustedYear;
    } else {
      this.currentSequenceStartYear = this.dataRange.startYear;
      this.currentSequenceStartSimYear = simulationYear;
      adjustedYear = this.currentSequenceStartYear;
      this.historicalRanges.push({ startYear: adjustedYear, endYear: adjustedYear });
    }

    const yearData = this.historicalData.find((data) => data.year === adjustedYear);
    if (!yearData) throw new Error(`Historical data not found for year ${adjustedYear}`);

    const returns: AssetReturnRates = { stocks: yearData.stockReturn, bonds: yearData.bondReturn, cash: yearData.cashReturn };
    return { returns, metadata: { inflationRate: yearData.inflationRate * 100 } };
  }

  getSelectedStartYear(): number {
    return this.selectedStartYear;
  }

  getHistoricalRanges(): Array<{ startYear: number; endYear: number }> {
    return [...this.historicalRanges];
  }
}
