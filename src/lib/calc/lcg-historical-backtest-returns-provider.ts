/**
 * LCG Historical Backtest Returns Provider - Random Start Year Historical Return System
 *
 * This module implements historical backtesting using NYU Stern historical financial market data
 * with Linear Congruential Generator (LCG) for random start year selection. Unlike the standard
 * historical backtest that tests every year, this provider randomly selects start years for
 * Monte Carlo-style historical analysis.
 *
 * Architecture:
 * - Uses LCG for reproducible random start year selection
 * - Leverages real historical returns from NYU dataset (1928-2024)
 * - Supports automatic looping when simulation extends beyond available data
 * - Maintains year-by-year progression through historical sequence
 * - Converts historical data format to standard AssetReturns interface
 *
 * Key Features:
 * - Random historical start year selection using seeded LCG
 * - Real historical market data validation
 * - Automatic data cycling for long simulations
 * - Consistent interface with other returns providers
 * - Year-aware progression through historical timeline
 */

import { ReturnsProvider, ReturnsWithMetadata } from './returns-provider';
import { nyuHistoricalData, NyuHistoricalYearData, getNyuDataRange } from './data/nyu-historical-data';
import { AssetReturns } from './asset';
import { SeededRandom } from './seeded-random';

/**
 * LCG Historical Backtest Returns Provider Implementation
 * Provides returns based on real historical data with randomly selected start years
 * Automatically loops back to beginning of data when simulation extends beyond available years
 */
export class LcgHistoricalBacktestReturnsProvider implements ReturnsProvider {
  private dataRange: { startYear: number; endYear: number };
  private historicalData: NyuHistoricalYearData[];
  private rng: SeededRandom;
  private selectedStartYear: number;
  private currentSequenceStartYear: number;
  private currentSequenceStartSimYear: number;

  /**
   * Creates an LCG historical backtest returns provider
   * @param seed - Base seed for LCG random number generation
   */
  constructor(seed: number) {
    this.dataRange = getNyuDataRange();
    this.historicalData = nyuHistoricalData;
    this.rng = new SeededRandom(seed);

    // Generate random start year using LCG
    this.selectedStartYear = this.generateRandomStartYear();
    this.currentSequenceStartYear = this.selectedStartYear;
    this.currentSequenceStartSimYear = 1;
  }

  /**
   * Generate a random start year within the available data range
   * @returns Random year between dataRange.startYear and dataRange.endYear (inclusive)
   */
  private generateRandomStartYear(): number {
    const yearRange = this.dataRange.endYear - this.dataRange.startYear + 1;
    const randomOffset = Math.floor(this.rng.next() * yearRange);
    return this.dataRange.startYear + randomOffset;
  }

  /**
   * Get historical returns for a specific simulation year
   * @param simulationYear - The year within the simulation (1-based, e.g., year 1 = first year of simulation)
   * @returns Real asset returns with inflation metadata from historical data
   */
  getReturns(simulationYear: number): ReturnsWithMetadata {
    // Calculate years into the current sequence
    const yearsIntoSequence = simulationYear - this.currentSequenceStartSimYear;
    const targetHistoricalYear = this.currentSequenceStartYear + yearsIntoSequence;

    let adjustedYear: number;

    if (targetHistoricalYear <= this.dataRange.endYear) {
      // Within range, use the year directly
      adjustedYear = targetHistoricalYear;
    } else {
      // We've hit the end of available data, start a new sequence
      this.currentSequenceStartYear = this.generateRandomStartYear();
      this.currentSequenceStartSimYear = simulationYear;
      adjustedYear = this.currentSequenceStartYear;
    }

    // Find the historical data for this year
    const yearData = this.historicalData.find((data) => data.year === adjustedYear);

    if (!yearData) {
      throw new Error(`Historical data not found for year ${adjustedYear}`);
    }

    // Convert NYU historical data format to AssetReturns format
    const returns: AssetReturns = {
      stocks: yearData.stockReturn,
      bonds: yearData.bondReturn,
      cash: yearData.cashReturn,
    };

    return {
      returns,
      metadata: {
        inflationRate: yearData.inflationRate * 100, // Convert to percentage for metadata
        extras: {
          historicalYear: adjustedYear,
          selectedStartYear: this.selectedStartYear,
          simulationYear,
        },
      },
    };
  }

  /**
   * Reset the provider for a new scenario with a different start year
   * @param scenarioNumber - Zero-based scenario index for deterministic seed generation
   * @returns The new start year selected for this scenario
   */
  resetForNewScenario(scenarioNumber: number): number {
    // Create unique seed for this scenario (similar to StochasticReturnsProvider approach)
    const baseSeed = Math.floor(Math.abs(scenarioNumber)) % 2147483648;
    this.rng.reset(baseSeed + scenarioNumber * 1000);

    // Generate new random start year for this scenario
    this.selectedStartYear = this.generateRandomStartYear();
    this.currentSequenceStartYear = this.selectedStartYear;
    this.currentSequenceStartSimYear = 1;

    return this.selectedStartYear;
  }
}
