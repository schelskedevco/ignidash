import { ReturnsProvider, type ReturnsWithMetadata } from './returns-provider';
import { nyuHistoricalData, type NyuHistoricalYearData, getNyuDataRange } from '../historical-data/nyu-historical-data';
import { shillerHistoricalData, type ShillerHistoricalYearData } from '../historical-data/shiller-historical-yield-data';
import type { AssetReturnRates } from '../asset';
import { SeededRandom } from './seeded-random';
import type { PhaseData, PhaseName } from '../phase';

export class LcgHistoricalBacktestReturnsProvider implements ReturnsProvider {
  private readonly historicalDataRange: { startYear: number; endYear: number };
  private readonly historicalData: NyuHistoricalYearData[];
  private readonly historicalYieldData: ShillerHistoricalYearData[];
  private readonly rng: SeededRandom;
  private currentHistoricalYear: number;
  private historicalRanges: Array<{ startYear: number; endYear: number }> = [];
  private phaseName: PhaseName | null = null;

  constructor(
    seed: number,
    startYearOverride: number | undefined,
    private retirementStartYearOverride: number | undefined
  ) {
    this.historicalDataRange = getNyuDataRange();
    this.historicalData = nyuHistoricalData;
    this.historicalYieldData = shillerHistoricalData;
    this.rng = new SeededRandom(seed);
    this.currentHistoricalYear = startYearOverride || this.generateRandomStartYear();
    this.historicalRanges = [{ startYear: this.currentHistoricalYear, endYear: this.currentHistoricalYear }];
  }

  private generateRandomStartYear(): number {
    const numberOfHistoricalYears = this.historicalDataRange.endYear - this.historicalDataRange.startYear + 1;
    const randomOffset = Math.floor(this.rng.next() * numberOfHistoricalYears);

    return this.historicalDataRange.startYear + randomOffset;
  }

  getReturns(phaseData: PhaseData | null): ReturnsWithMetadata {
    const prevPhaseName = this.phaseName;
    const currPhaseName = phaseData?.name ?? null;

    if (this.retirementStartYearOverride !== undefined && prevPhaseName !== 'retirement' && currPhaseName === 'retirement') {
      this.phaseName = currPhaseName;

      this.currentHistoricalYear = this.retirementStartYearOverride;
      this.historicalRanges.push({ startYear: this.currentHistoricalYear, endYear: this.currentHistoricalYear });
    } else if (this.currentHistoricalYear <= this.historicalDataRange.endYear) {
      this.historicalRanges[this.historicalRanges.length - 1].endYear = this.currentHistoricalYear;
    } else {
      this.currentHistoricalYear = this.historicalDataRange.startYear;
      this.historicalRanges.push({ startYear: this.currentHistoricalYear, endYear: this.currentHistoricalYear });
    }

    const yearData = this.historicalData.find((data) => data.year === this.currentHistoricalYear);
    const yieldData = this.historicalYieldData.find((data) => data.year === this.currentHistoricalYear);

    if (!yearData || !yieldData) throw new Error(`Historical data not found for year ${this.currentHistoricalYear}`);

    this.currentHistoricalYear += 1;

    const returns: AssetReturnRates = { stocks: yearData.stockReturn, bonds: yearData.bondReturn, cash: yearData.cashReturn };
    const nominalCashYield = (1 + returns.cash) * (1 + yearData.inflationRate) - 1;

    return {
      returns,
      yields: { stocks: yieldData.stockYield * 100, bonds: yieldData.bondYield * 100, cash: nominalCashYield * 100 },
      inflationRate: yearData.inflationRate * 100,
      metadata: {},
    };
  }

  getHistoricalRanges(): Array<{ startYear: number; endYear: number }> {
    return [...this.historicalRanges];
  }
}
