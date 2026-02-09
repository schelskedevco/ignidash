/**
 * Historical backtest returns provider using LCG-seeded random start years
 *
 * Walks through actual historical return data (NYU/Shiller datasets) starting
 * from a randomly selected or user-specified year. Wraps around to the beginning
 * of the dataset when the end is reached. Optionally resets to a different start
 * year at the retirement phase transition.
 */

import { ReturnsProvider, type ReturnsProviderData } from './returns-provider';
import { nyuHistoricalData, type NyuHistoricalYearData, getNyuDataRange } from '../historical-data/nyu-historical-data';
import { shillerHistoricalData, type ShillerHistoricalYearData } from '../historical-data/shiller-historical-yield-data';
import type { AssetReturnRates } from '../asset';
import { SeededRandom } from './seeded-random';
import type { PhaseData, PhaseName } from '../phase';

/** Replays historical market data sequentially from a seeded random start year */
export class LcgHistoricalBacktestReturnsProvider implements ReturnsProvider {
  private readonly historicalDataRange: { startYear: number; endYear: number };
  private readonly historicalData: NyuHistoricalYearData[];
  private readonly historicalYieldData: ShillerHistoricalYearData[];
  private readonly rng: SeededRandom;

  private currentHistoricalYear: number;
  private historicalRanges: Array<{ startYear: number; endYear: number }> = [];
  private phaseName: PhaseName | null = null;

  /**
   * @param seed - Seed for LCG random start year selection
   * @param startYearOverride - If set, use this historical year instead of random
   * @param retirementStartYearOverride - If set, reset to this year when entering retirement phase
   */
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

  /**
   * Returns historical market data for the current year and advances the pointer
   * @param phaseData - Current simulation phase, used to detect retirement transition
   * @returns Historical returns, yields, and inflation for the current year
   */
  getReturns(phaseData: PhaseData | null): ReturnsProviderData {
    const prevPhaseName = this.phaseName;
    const currPhaseName = phaseData?.name ?? null;

    // Reset to retirement start year override when entering retirement phase
    if (this.retirementStartYearOverride !== undefined && prevPhaseName !== 'retirement' && currPhaseName === 'retirement') {
      this.phaseName = currPhaseName;

      this.currentHistoricalYear = this.retirementStartYearOverride;
      this.historicalRanges.push({ startYear: this.currentHistoricalYear, endYear: this.currentHistoricalYear });
    } else if (this.currentHistoricalYear <= this.historicalDataRange.endYear) {
      this.historicalRanges[this.historicalRanges.length - 1].endYear = this.currentHistoricalYear;
    } else {
      // Wrap around to beginning of historical dataset
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
    };
  }

  /** Returns the sequence of historical year ranges used during the simulation */
  getHistoricalRanges(): Array<{ startYear: number; endYear: number }> {
    return [...this.historicalRanges];
  }
}
