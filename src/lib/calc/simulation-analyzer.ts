/**
 * Simulation Analysis - Statistical Analysis for Financial Simulations
 *
 * This module provides comprehensive statistical analysis capabilities for financial simulation results.
 * It processes both individual simulation results and aggregates from Monte Carlo runs to extract
 * meaningful insights about portfolio performance, asset allocation effectiveness, and risk metrics.
 *
 * Architecture:
 * - SimulationAnalyzer class for statistical computations
 * - Aggregate analysis across multiple simulation runs
 * - Statistical measures: mean, median, min, max, standard deviation
 *
 * Key Features:
 * - Individual simulation analysis with comprehensive statistical breakdowns
 * - Multi-simulation aggregate statistics with success rates and percentiles
 * - Asset-level and portfolio-level statistical analysis
 * - Returns analysis for period-over-period performance tracking
 * - Integration with existing simulation engine and portfolio structures
 */

import { AssetClass } from './asset';
import { Portfolio } from './portfolio';
import { SimulationResult } from './simulation-engine';
import { ReturnsWithMetadata } from './returns-provider';

/**
 * Core statistical measures for asset or portfolio values
 */
export interface Stats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number | null;
}

/**
 * Asset-specific statistical analysis
 * Provides statistics for each asset class (stocks, bonds, cash)
 */
export interface AssetStats {
  stocks: Stats | null;
  bonds: Stats | null;
  cash: Stats | null;
}

/**
 * Portfolio-level statistical analysis
 * Includes both asset-level and overall portfolio statistics
 */
export interface PortfolioStats {
  assets: AssetStats;
  overall: Stats | null;
}

/**
 * Returns analysis for period-over-period performance
 */
export interface ReturnsStats {
  rates: AssetStats;
  amounts: AssetStats;
}

/**
 * Cash flows statistics for analyzing income and expenses
 */
export interface CashFlowsStats {
  byName: Record<string, Stats | null>;
}

/**
 * Comprehensive simulation analysis result
 * Includes both asset-level and portfolio-level simulation statistics
 */
export interface SimulationStats {
  values: PortfolioStats;
  returns: ReturnsStats;
}

/**
 * Percentile distribution for statistical analysis
 */
export interface Percentiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

/**
 * Statistics for multiple simulations
 */
export interface MultiSimulationStats {
  count: number;
  values: PortfolioStats;
  returns: ReturnsStats;
  percentiles: Percentiles;
}

/**
 * Aggregate statistics across multiple simulations
 * Used for Monte Carlo analysis and risk assessment
 */
export interface AggregateSimulationStats extends MultiSimulationStats {
  successRate: number;

  // Segmented statistics for successful simulations
  successStats: MultiSimulationStats | null;

  // Segmented statistics for failed simulations
  failStats:
    | (MultiSimulationStats & {
        durationPercentiles: Percentiles;
      })
    | null;

  // Yearly progression tracking
  yearlyProgression: Array<
    MultiSimulationStats & {
      year: number;
      phasePercentages: {
        accumulation: number;
        retirement: number;
        bankrupt: number;
      };
      cashFlows: CashFlowsStats;
    }
  >;

  // Phase-specific statistics for detailed analysis
  phaseStats: Array<
    MultiSimulationStats & {
      phaseName: string;
      durationPercentiles: Percentiles;
    }
  > | null;
}

/**
 * SimulationAnalyzer - Statistical Analysis for Financial Simulations
 *
 * Provides comprehensive statistical analysis for individual simulations and aggregated
 * Monte Carlo results. Calculates key performance metrics, risk measures, and statistical
 * breakdowns to support financial planning decision-making.
 */
export class SimulationAnalyzer {
  /**
   * Analyzes a single simulation result
   * Calculates statistical measures for asset values, portfolio totals, and returns
   *
   * @param result - Individual simulation result from FinancialSimulationEngine
   * @returns Comprehensive statistical analysis with asset-level and portfolio-level metrics
   */
  analyzeSimulation(result: SimulationResult): SimulationStats | null {
    if (result.data.length === 0) return null;

    const portfolios = result.data.map(([, portfolio]) => portfolio);
    const returnsMetadata = result.returnsMetadata.map(([, metadata]) => metadata);

    return {
      values: this.calculatePortfolioStats(portfolios),
      returns: this.calculateReturnsStats(returnsMetadata),
    };
  }

  /**
   * Analyzes multiple simulation results for aggregate statistics
   * Calculates success rates, percentiles, and aggregate performance metrics
   *
   * @param results - Array of simulation results from Monte Carlo runs
   * @returns Aggregate statistical analysis across all simulations
   */
  analyzeSimulations(results: SimulationResult[]): AggregateSimulationStats | null {
    const count = results.length;
    if (count === 0) return null;

    // Segment simulations into successful and failed
    const successResults = results.filter((result) => result.success);
    const failResults = results.filter((result) => !result.success);

    const successCount = successResults.length;
    const successRate = successCount / count;

    // Calculate overall statistics
    const finalValues = results
      .map((result) => {
        if (result.data.length === 0) throw new Error('No data points in simulation result');

        // Get the last portfolio value in the simulation
        const lastDataPoint = result.data[result.data.length - 1];
        return lastDataPoint[1].getTotalValue();
      })
      .sort((a, b) => a - b);

    // Aggregate all portfolios and returns metadata for overall statistics
    const allPortfolios = results.flatMap(({ data }) => data.map(([, portfolio]) => portfolio));
    const allReturnsMetadata = results.flatMap(({ returnsMetadata }) => returnsMetadata.map(([, metadata]) => metadata));

    // Calculate success segment statistics
    let successStats = null;

    const successSegmentStats = this.calculateSegmentStats(successResults);
    if (successSegmentStats) {
      successStats = {
        ...successSegmentStats,
        count: successResults.length,
      };
    }

    // Calculate fail segment statistics
    let failStats = null;

    const failSegmentStats = this.calculateSegmentStats(failResults);
    if (failSegmentStats) {
      failStats = {
        ...failSegmentStats,
        count: failResults.length,
        durationPercentiles: this.calculatePercentilesOfDepletion(failResults),
      };
    }

    return {
      successRate,
      count,
      values: this.calculatePortfolioStats(allPortfolios),
      returns: this.calculateReturnsStats(allReturnsMetadata),
      percentiles: this.calculatePercentilesFromValues(finalValues),
      successStats,
      failStats,
      yearlyProgression: this.buildYearlyProgression(results),
      phaseStats: this.buildPhaseStats(results),
    };
  }

  /**
   * Calculates statistical measures for portfolio values across all asset classes
   *
   * @param portfolios - Array of portfolio instances to analyze
   * @returns Portfolio statistics including asset-level and overall portfolio metrics
   */
  private calculatePortfolioStats(portfolios: Portfolio[]): PortfolioStats {
    const assetClasses: AssetClass[] = ['stocks', 'bonds', 'cash'];
    const assets: AssetStats = {} as AssetStats;

    // Calculate statistics for each asset class
    for (const assetClass of assetClasses) {
      const values = portfolios.map((portfolio) => portfolio.getAssetValue(assetClass));
      assets[assetClass] = this.calculateStats(values);
    }

    // Calculate overall portfolio statistics
    const portfolioValues = portfolios.map((portfolio) => portfolio.getTotalValue());
    const overall = this.calculateStats(portfolioValues);

    return { assets, overall };
  }

  /**
   * Calculates returns statistics from returnsMetadata
   *
   * @param returnsMetadata - Array of returns metadata from simulations
   * @returns Returns statistics for each asset class and overall portfolio
   */
  private calculateReturnsStats(returnsMetadata: ReturnsWithMetadata[]): ReturnsStats {
    const assetClasses: AssetClass[] = ['stocks', 'bonds', 'cash'];

    const rates: AssetStats = {} as AssetStats;
    const amounts: AssetStats = {} as AssetStats;

    // Calculate returns for each asset class
    for (const assetClass of assetClasses) {
      const returnRates = returnsMetadata.map((metadata) => metadata.returns[assetClass]);
      rates[assetClass] = this.calculateStats(returnRates);

      const returnAmounts = returnsMetadata.map((metadata) => metadata.amounts![assetClass]);
      amounts[assetClass] = this.calculateStats(returnAmounts);
    }

    return { rates, amounts };
  }

  /**
   * Calculates cash flows statistics from cash flows metadata
   *
   * @param cashFlowsMetadata - Array of cash flows metadata containing name/amount pairs
   * @returns Cash flows statistics grouped by name
   */
  private calculateCashFlowsStats(cashFlowsMetadata: Array<Array<{ name: string; amount: number }>>): CashFlowsStats {
    const byName: Record<string, Stats | null> = {};

    // First, collect all unique names
    const names = new Set<string>();
    for (const cashFlows of cashFlowsMetadata) {
      for (const flow of cashFlows) {
        names.add(flow.name);
      }
    }

    // Calculate statistics for each name
    for (const name of names) {
      const amounts: number[] = [];

      // Collect amounts for this specific name across all periods
      for (const cashFlows of cashFlowsMetadata) {
        // Sum amounts for this name in this period (in case of multiple entries with same name)
        const nameTotal = cashFlows.filter((flow) => flow.name === name).reduce((sum, flow) => sum + flow.amount, 0);

        if (nameTotal !== 0 || cashFlows.some((flow) => flow.name === name)) {
          amounts.push(nameTotal);
        }
      }

      byName[name] = this.calculateStats(amounts);
    }

    return { byName };
  }

  /**
   * Calculates standard statistical measures for a dataset
   *
   * @param values - Array of numerical values to analyze
   * @returns Statistical measures (mean, median, min, max, stdDev) or null if empty
   */
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

  /**
   * Calculates median value from a sorted array
   *
   * @param sortedValues - Pre-sorted array of numerical values
   * @returns Median value
   */
  private calculateMedian(sortedValues: number[]): number {
    const length = sortedValues.length;
    if (length % 2 === 0) {
      return (sortedValues[length / 2 - 1] + sortedValues[length / 2]) / 2;
    } else {
      return sortedValues[Math.floor(length / 2)];
    }
  }

  /**
   * Calculates standard deviation for a dataset
   *
   * @param values - Array of numerical values
   * @param mean - Pre-calculated mean of the dataset
   * @returns Standard deviation
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculates percentile value from a sorted array
   *
   * @param sortedValues - Pre-sorted array of numerical values
   * @param percentile - Percentile to calculate (0-100)
   * @returns Value at the specified percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.floor((percentile / 100) * sortedValues.length);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  }

  /**
   * Calculates all standard percentiles from a sorted array
   *
   * @param sortedValues - Pre-sorted array of numerical values
   * @returns Standard percentiles (p10, p25, p50, p75, p90)
   */
  private calculatePercentilesFromValues(sortedValues: number[]): Percentiles {
    return {
      p10: this.calculatePercentile(sortedValues, 10),
      p25: this.calculatePercentile(sortedValues, 25),
      p50: this.calculatePercentile(sortedValues, 50),
      p75: this.calculatePercentile(sortedValues, 75),
      p90: this.calculatePercentile(sortedValues, 90),
    };
  }

  /**
   * Calculates comprehensive statistics for a segment of simulations
   *
   * @param results - Array of simulation results to analyze
   * @returns Statistics including values, returns, and percentiles
   */
  private calculateSegmentStats(segmentResults: SimulationResult[]): Omit<MultiSimulationStats, 'count'> | null {
    if (segmentResults.length === 0) return null;

    // Extract segment portfolios, metadata from segment simulations
    const segmentPortfolios = segmentResults.flatMap(({ data }) => data.map(([, portfolio]) => portfolio));
    const segmentReturnsMetadata = segmentResults.flatMap(({ returnsMetadata }) => returnsMetadata.map(([, metadata]) => metadata));

    // Calculate portfolio and returns statistics
    const values = this.calculatePortfolioStats(segmentPortfolios);
    const returns = this.calculateReturnsStats(segmentReturnsMetadata);

    // Calculate percentiles based on final portfolio values
    const finalValues = segmentResults
      .map((result) => {
        if (result.data.length === 0) return 0;

        // Get the last portfolio value in the simulation
        const lastDataPoint = result.data[result.data.length - 1];
        return lastDataPoint[1].getTotalValue();
      })
      .sort((a, b) => a - b);

    const percentiles = this.calculatePercentilesFromValues(finalValues);

    return { values, returns, percentiles };
  }

  /**
   * Calculates average years to depletion for failed simulations
   *
   * @param failedResults - Array of failed simulation results
   * @returns Percentiles of years until portfolio depletion
   */
  private calculatePercentilesOfDepletion(failedResults: SimulationResult[]): Percentiles {
    if (failedResults.length === 0) throw new Error('No failed simulations to analyze');

    const depletionYears = failedResults.map((result) => result.data.find(([, portfolio]) => portfolio.getTotalValue() <= 1)![0]);
    const sortedYears = depletionYears.sort((a, b) => a - b);

    return this.calculatePercentilesFromValues(sortedYears);
  }

  /**
   * Builds yearly progression statistics across all simulations
   *
   * @param results - Array of all simulation results
   * @returns Yearly statistics including chance to reach and portfolio values
   */
  private buildYearlyProgression(results: SimulationResult[]): Array<
    MultiSimulationStats & {
      year: number;
      phasePercentages: {
        accumulation: number;
        retirement: number;
        bankrupt: number;
      };
      cashFlows: CashFlowsStats;
    }
  > {
    if (results.length === 0) return [];

    // Since all simulations have the same structure, we can use the first one to determine years
    const totalYears = results[0].data.length;
    const yearlyProgression = [];

    for (let year = 0; year < totalYears; year++) {
      // Direct array access since all simulations have data for all years
      const portfolios = results.map((result) => result.data[year][1]);

      // Returns metadata starts at year 1
      const returnsMetadata = year > 0 ? results.map((result) => result.returnsMetadata[year - 1][1]) : [];

      // Cash flows metadata starts at year 1
      const cashFlowsMetadata = year > 0 ? results.map((result) => result.cashFlowsMetadata[year - 1][1]) : [];

      // Calculate statistics for this year
      const count = portfolios.length;
      const values = this.calculatePortfolioStats(portfolios);
      const returns = this.calculateReturnsStats(returnsMetadata);
      const cashFlows = this.calculateCashFlowsStats(cashFlowsMetadata);

      // Calculate percentiles from portfolio values for this year
      const yearlyValues = portfolios.map((portfolio) => portfolio.getTotalValue()).sort((a, b) => a - b);
      const percentiles = this.calculatePercentilesFromValues(yearlyValues);

      // Calculate phase percentages for this year
      let accumulationCount = 0;
      let retirementCount = 0;
      let bankruptCount = 0;

      for (const result of results) {
        const portfolio = result.data[year][1];
        const portfolioValue = portfolio.getTotalValue();

        // Check if simulation is bankrupt
        if (portfolioValue <= 1) {
          bankruptCount++;
        } else {
          // Only count phase if not bankrupt
          const phaseName = result.phasesMetadata.find(([phaseYear]) => phaseYear === year)![1].getName();
          if (phaseName === 'Accumulation') {
            accumulationCount++;
          } else if (phaseName === 'Retirement') {
            retirementCount++;
          } else {
            throw new Error(`Unknown phase name: ${phaseName}`);
          }
        }
      }

      const phasePercentages = {
        accumulation: (accumulationCount / count) * 100,
        retirement: (retirementCount / count) * 100,
        bankrupt: (bankruptCount / count) * 100,
      };

      yearlyProgression.push({ year, count, values, returns, percentiles, phasePercentages, cashFlows });
    }

    return yearlyProgression;
  }

  /**
   * Builds phase statistics across all simulations
   * Analyzes portfolio performance during different life phases (accumulation, retirement)
   *
   * @param results - Array of all simulation results
   * @returns Phase-specific statistics with durations and performance metrics
   */
  private buildPhaseStats(results: SimulationResult[]): Array<
    MultiSimulationStats & {
      phaseName: string;
      durationPercentiles: Percentiles;
    }
  > | null {
    if (results.length === 0) return null;

    // Extract all unique phase names across all simulations
    const phaseNames = new Set<string>();
    for (const result of results) {
      for (const [, phase] of result.phasesMetadata) {
        phaseNames.add(phase.getName());
      }
    }

    if (phaseNames.size === 0) return null;

    // Build statistics for each phase
    const phaseStats = [];

    for (const phaseName of Array.from(phaseNames)) {
      // Extract data for this specific phase across all simulations
      const phaseData = this.extractPhaseData(results, phaseName);

      if (phaseData.portfolios.length === 0) continue;

      // Calculate statistics for this phase
      const values = this.calculatePortfolioStats(phaseData.portfolios);
      const returns = this.calculateReturnsStats(phaseData.returnsMetadata);

      // Calculate percentiles from phase-specific portfolio values
      const sortedPhasePortfolioValues = phaseData.portfolios.map((portfolio) => portfolio.getTotalValue()).sort((a, b) => a - b);
      const percentiles = this.calculatePercentilesFromValues(sortedPhasePortfolioValues);

      // Calculate percentiles for duration in this phase
      const sortedDurations = phaseData.durations.sort((a, b) => a - b);
      const durationPercentiles = this.calculatePercentilesFromValues(sortedDurations);

      phaseStats.push({ phaseName, durationPercentiles, count: phaseData.simulationCount, values, returns, percentiles });
    }

    return phaseStats;
  }

  /**
   * Extracts portfolio data, returns metadata, and duration information for a specific phase
   *
   * @param results - Array of all simulation results
   * @param phaseName - Name of the phase to extract data for
   * @returns Aggregated data for the specified phase
   */
  private extractPhaseData(
    results: SimulationResult[],
    phaseName: string
  ): {
    portfolios: Portfolio[];
    returnsMetadata: ReturnsWithMetadata[];
    durations: number[];
    simulationCount: number;
  } {
    const portfolios = [];
    const returnsMetadata = [];
    const durations = [];

    let simulationCount = 0;

    for (const result of results) {
      // Track if this simulation had the phase
      let hadPhase = false;
      let phaseStartYear: number | null = null;
      let phaseEndYear: number | null = null;

      // Find all time periods where this phase was active
      for (const [year, phase] of result.phasesMetadata) {
        if (phase.getName() === phaseName) {
          if (phaseStartYear === null) {
            phaseStartYear = year;
            hadPhase = true;
          }
          phaseEndYear = year;
        }
      }

      if (!hadPhase) continue;

      simulationCount++;
      durations.push(phaseEndYear! - phaseStartYear! + 1);

      // Build a map for efficient phase lookup
      const phaseMap = new Map<number, string>();
      for (const [year, phase] of result.phasesMetadata) {
        phaseMap.set(year, phase.getName());
      }

      // Extract portfolio data for years when this phase was active
      for (const [year, portfolio] of result.data) {
        if (phaseMap.get(year) === phaseName) portfolios.push(portfolio);
      }

      // Extract returns metadata for years when this phase was active
      for (const [year, metadata] of result.returnsMetadata) {
        if (phaseMap.get(year) === phaseName) returnsMetadata.push(metadata);
      }
    }

    return {
      portfolios,
      returnsMetadata,
      durations,
      simulationCount,
    };
  }
}
