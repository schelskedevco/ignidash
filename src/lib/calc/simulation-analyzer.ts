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
  assets: AssetStats;
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
        avgYearsToDepletion: number;
      })
    | null;

  // Yearly progression tracking
  yearlyProgression: Array<
    MultiSimulationStats & {
      year: number;
      survivalRate: number;
    }
  >;
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
        avgYearsToDepletion: this.calculateAvgDepletion(failResults),
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
    const assets: AssetStats = {} as AssetStats;

    // Calculate returns for each asset class
    for (const assetClass of assetClasses) {
      const returns = returnsMetadata.map((metadata) => metadata.returns[assetClass]);
      assets[assetClass] = this.calculateStats(returns);
    }

    return { assets };
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
   * @returns Average years until portfolio depletion
   */
  private calculateAvgDepletion(failedResults: SimulationResult[]): number {
    if (failedResults.length === 0) throw new Error('No failed simulations to analyze');

    const depletionYears = failedResults.map((result) => result.data[result.data.length - 1][0]);

    const sum = depletionYears.reduce((acc, years) => acc + years, 0);
    return sum / depletionYears.length;
  }

  /**
   * Builds yearly progression statistics across all simulations
   *
   * @param results - Array of all simulation results
   * @returns Yearly statistics including survival rate and portfolio values
   */
  private buildYearlyProgression(results: SimulationResult[]): Array<
    MultiSimulationStats & {
      year: number;
      survivalRate: number;
    }
  > {
    if (results.length === 0) return [];

    const maxYears = Math.max(...results.map((result) => result.data[result.data.length - 1][0]));
    const yearlyProgression = [];

    for (let year = 0; year < maxYears; year++) {
      const activeResults = results.filter((result) => result.data.some(([time]) => time === year));

      const activePortfolios = activeResults.map((result) => result.data.find(([time]) => time === year)![1]);
      const activeReturnsMetadata = activeResults
        .map((result) => result.returnsMetadata.find(([time]) => time === year)?.[1])
        .filter((metadata) => metadata !== undefined);

      const count = activePortfolios.length;
      const survivalRate = count / results.length;
      const values = this.calculatePortfolioStats(activePortfolios);
      const returns = this.calculateReturnsStats(activeReturnsMetadata);

      const yearlyValues = activePortfolios.map((portfolio) => portfolio.getTotalValue()).sort((a, b) => a - b);
      const percentiles = this.calculatePercentilesFromValues(yearlyValues);

      yearlyProgression.push({ year, count, survivalRate, values, returns, percentiles });
    }

    return yearlyProgression;
  }
}
