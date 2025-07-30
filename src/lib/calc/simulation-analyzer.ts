/**
 * Simulation Analysis - Statistical Analysis for Financial Simulations
 *
 * This module provides comprehensive statistical analysis capabilities for financial simulation results.
 * It processes both individual simulation results and aggregates from Monte Carlo runs to extract
 * meaningful insights about portfolio performance, asset allocation effectiveness, and risk metrics.
 *
 * Architecture:
 * - SimulationAnalyzer class for statistical computations
 * - Phase-aware analysis respecting simulation phases (accumulation vs. retirement)
 * - Aggregate analysis across multiple simulation runs
 * - Statistical measures: mean, median, min, max, standard deviation
 *
 * Key Features:
 * - Individual simulation analysis with phase-specific breakdowns
 * - Multi-simulation aggregate statistics with success rates and percentiles
 * - Asset-level and portfolio-level statistical analysis
 * - Returns analysis for period-over-period performance tracking
 * - Integration with existing simulation engine and portfolio structures
 */

import { AssetClass } from './asset';
import { Portfolio } from './portfolio';
import { SimulationResult } from './simulation-engine';

/**
 * Core statistical measures for asset or portfolio values
 */
interface Stats {
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
interface AssetStats {
  stocks: Stats | null;
  bonds: Stats | null;
  cash: Stats | null;
}

/**
 * Portfolio-level statistical analysis
 * Includes both asset-level and overall portfolio statistics
 */
interface PortfolioStats {
  assets: AssetStats;
  overall: Stats | null;
}

/**
 * Returns analysis for period-over-period performance
 */
interface ReturnsStats {
  assets: AssetStats;
  overall: Stats | null;
}

/**
 * Comprehensive simulation analysis result
 * Includes both phase-specific and overall simulation statistics
 */
interface SimulationStats {
  values: PortfolioStats;
  returns: ReturnsStats;
}

/**
 * Aggregate statistics across multiple simulations
 * Used for Monte Carlo analysis and risk assessment
 */
interface AggregateSimulationStats {
  successRate: number;
  simulationCount: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  overallStats: {
    values: PortfolioStats;
    returns: ReturnsStats;
  };
}

/**
 * SimulationAnalyzer - Statistical Analysis for Financial Simulations
 *
 * Provides comprehensive statistical analysis for individual simulations and aggregated
 * Monte Carlo results. Calculates key performance metrics, risk measures, and phase-aware
 * breakdowns to support financial planning decision-making.
 */
export class SimulationAnalyzer {
  /**
   * Analyzes a single simulation result with phase-aware breakdown
   * Calculates statistical measures for asset values, portfolio totals, and returns
   *
   * @param result - Individual simulation result from FinancialSimulationEngine
   * @returns Comprehensive statistical analysis with phase-specific and overall metrics
   */
  analyzeSimulation(result: SimulationResult): SimulationStats | null {
    if (result.data.length === 0) return null;

    const portfolios = result.data.map(([, portfolio]) => portfolio);

    return {
      values: this.calculatePortfolioStats(portfolios),
      returns: this.calculateReturnsStats(portfolios),
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
    const simulationCount = results.length;
    if (simulationCount === 0) return null;

    const successCount = results.filter((result) => result.success).length;
    const successRate = successCount / simulationCount;

    const finalValues = results
      .map((result) => {
        if (result.data.length === 0) throw new Error('No data points in simulation result');

        // Get the last portfolio value in the simulation
        const lastDataPoint = result.data[result.data.length - 1];
        return lastDataPoint[1].getTotalValue();
      })
      .sort((a, b) => a - b);

    const allPortfolios = results.flatMap(({ data }) => data.map(([, portfolio]) => portfolio));

    return {
      successRate,
      simulationCount,
      percentiles: {
        p10: this.calculatePercentile(finalValues, 10),
        p25: this.calculatePercentile(finalValues, 25),
        p50: this.calculatePercentile(finalValues, 50),
        p75: this.calculatePercentile(finalValues, 75),
        p90: this.calculatePercentile(finalValues, 90),
      },
      overallStats: {
        values: this.calculatePortfolioStats(allPortfolios),
        returns: this.calculateReturnsStats(allPortfolios),
      },
    };
  }

  /**
   * Calculates statistical measures for portfolio values across all asset classes
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
   * Calculates returns statistics for period-over-period performance
   */
  private calculateReturnsStats(portfolios: Portfolio[]): ReturnsStats {
    const assetClasses: AssetClass[] = ['stocks', 'bonds', 'cash'];
    const assets: AssetStats = {} as AssetStats;

    // Calculate returns for each asset class
    for (const assetClass of assetClasses) {
      const returns = this.calculateAssetReturns(portfolios, assetClass);
      assets[assetClass] = this.calculateStats(returns);
    }

    // Calculate overall portfolio returns
    const portfolioReturns = this.calculatePortfolioReturns(portfolios);
    const overall = this.calculateStats(portfolioReturns);

    return { assets, overall };
  }

  /**
   * Calculates standard statistical measures for a dataset
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
   */
  private calculateMedian(sortedValues: number[]): number {
    if (length % 2 === 0) {
      return (sortedValues[length / 2 - 1] + sortedValues[length / 2]) / 2;
    } else {
      return sortedValues[Math.floor(length / 2)];
    }
  }

  /**
   * Calculates standard deviation for a dataset
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculates percentile value from a sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.floor((percentile / 100) * sortedValues.length);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  }

  /**
   * Calculates period-over-period returns for a specific asset class
   */
  private calculateAssetReturns(portfolios: Portfolio[], assetClass: AssetClass): number[] {
    const returns: number[] = [];
    for (let i = 1; i < portfolios.length; i++) {
      const prevValue = portfolios[i - 1].getAssetValue(assetClass);
      const currentValue = portfolios[i].getAssetValue(assetClass);

      if (prevValue > 0) {
        returns.push((currentValue - prevValue) / prevValue);
      } else {
        returns.push(0);
      }
    }

    return returns;
  }

  /**
   * Calculates period-over-period returns for total portfolio
   */
  private calculatePortfolioReturns(portfolios: Portfolio[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < portfolios.length; i++) {
      const prevValue = portfolios[i - 1].getTotalValue();
      const currentValue = portfolios[i].getTotalValue();

      if (prevValue > 0) {
        returns.push((currentValue - prevValue) / prevValue);
      } else {
        returns.push(0);
      }
    }

    return returns;
  }
}
