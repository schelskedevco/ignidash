import { ReturnsProvider, ReturnsWithMetadata } from './returns-provider';
import { nyuHistoricalData, NyuHistoricalYearData, getNyuDataRange } from '../data/nyu-historical-data';
import { AssetReturnRates } from '../asset';
import { SeededRandom } from './seeded-random';

export class LcgHistoricalBacktestReturnsProvider implements ReturnsProvider {
  private readonly historicalDataRange: { startYear: number; endYear: number };
  private readonly historicalData: NyuHistoricalYearData[];
  private readonly rng: SeededRandom;
  private currentHistoricalYear: number;
  private historicalRanges: Array<{ startYear: number; endYear: number }> = [];

  constructor(seed: number) {
    this.historicalDataRange = getNyuDataRange();
    this.historicalData = nyuHistoricalData;
    this.rng = new SeededRandom(seed);
    this.currentHistoricalYear = this.generateRandomStartYear();
    this.historicalRanges = [{ startYear: this.currentHistoricalYear, endYear: this.currentHistoricalYear }];
  }

  private generateRandomStartYear(): number {
    const numberOfHistoricalYears = this.historicalDataRange.endYear - this.historicalDataRange.startYear + 1;
    const randomOffset = Math.floor(this.rng.next() * numberOfHistoricalYears);

    return this.historicalDataRange.startYear + randomOffset;
  }

  getReturns(simulationYear: number): ReturnsWithMetadata {
    if (this.currentHistoricalYear <= this.historicalDataRange.endYear) {
      this.historicalRanges[this.historicalRanges.length - 1].endYear = this.currentHistoricalYear;
    } else {
      this.currentHistoricalYear = this.historicalDataRange.startYear;
      this.historicalRanges.push({ startYear: this.currentHistoricalYear, endYear: this.currentHistoricalYear });
    }

    const yearData = this.historicalData.find((data) => data.year === this.currentHistoricalYear);
    if (!yearData) throw new Error(`Historical data not found for year ${this.currentHistoricalYear}`);

    const returns: AssetReturnRates = { stocks: yearData.stockReturn, bonds: yearData.bondReturn, cash: yearData.cashReturn };
    return { returns, metadata: { inflationRate: yearData.inflationRate * 100 } };
  }

  getHistoricalRanges(): Array<{ startYear: number; endYear: number }> {
    return [...this.historicalRanges];
  }
}
