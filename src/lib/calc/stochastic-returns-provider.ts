/**
 * Stochastic Returns Provider - Monte Carlo Return Generation System
 *
 * This module implements probabilistic return generation for Monte Carlo simulations.
 * It combines user-defined expected returns with historical volatility patterns to
 * create realistic market scenarios while respecting correlations between asset classes.
 *
 * Architecture:
 * - Seeded random number generation for reproducibility
 * - Correlated asset returns using Cholesky decomposition
 * - Log-normal distribution for equity returns
 * - Normal distribution for bonds, cash, and inflation
 * - Fisher equation for real return calculations
 */

import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { ReturnsProvider, ReturnsWithMetadata } from './returns-provider';

/**
 * Seeded random number generator for reproducible simulations
 * Uses a linear congruential generator (LCG) algorithm
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // LCG parameters (same as glibc)
    const a = 1103515245;
    const c = 12345;
    const m = 2 ** 32;

    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Generate a random number from standard normal distribution (mean=0, std=1)
   * Uses Box-Muller transform
   */
  nextGaussian(): number {
    const u1 = this.next();
    const u2 = this.next();

    // Box-Muller transform
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0;
  }

  /**
   * Reset the generator with a new seed
   */
  reset(seed: number): void {
    this.seed = seed;
  }
}

/**
 * Market parameters with historical volatility estimates
 */
interface MarketVolatility {
  stocks: number; // Annual standard deviation
  bonds: number; // Annual standard deviation
  cash: number; // Annual standard deviation
  inflation: number; // Annual standard deviation
}

/**
 * Default historical volatility parameters
 * Based on long-term historical data
 */
const DEFAULT_VOLATILITY: MarketVolatility = {
  stocks: 0.2, // 20% annual volatility
  bonds: 0.05, // 5% annual volatility
  cash: 0.01, // 1% annual volatility
  inflation: 0.015, // 1.5% annual volatility
};

/**
 * Correlation matrix for asset classes and inflation
 * Based on historical correlations
 */
const CORRELATION_MATRIX = [
  // Stocks, Bonds, Cash, Inflation
  [1.0, -0.2, 0.1, -0.15], // Stocks
  [-0.2, 1.0, 0.3, -0.3], // Bonds
  [0.1, 0.3, 1.0, 0.6], // Cash
  [-0.15, -0.3, 0.6, 1.0], // Inflation
];

/**
 * Cholesky decomposition of correlation matrix
 * Pre-computed for performance
 */
function computeCholeskyDecomposition(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }

      if (i === j) {
        L[i][j] = Math.sqrt(matrix[i][i] - sum);
      } else {
        L[i][j] = (matrix[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

/**
 * Pre-computed Cholesky decomposition of the correlation matrix
 */
const CHOLESKY_MATRIX = computeCholeskyDecomposition(CORRELATION_MATRIX);

/**
 * Stochastic Returns Provider Implementation
 * Generates correlated, probabilistic returns based on user expectations and historical volatility
 */
export class StochasticReturnsProvider implements ReturnsProvider {
  private rng: SeededRandom;
  private volatility: MarketVolatility;
  private scenarioSeed: number;

  constructor(
    private inputs: QuickPlanInputs,
    options?: {
      seed?: number;
      volatility?: Partial<MarketVolatility>;
    }
  ) {
    // Initialize with seed for this specific scenario
    this.scenarioSeed = options?.seed ?? Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(this.scenarioSeed);

    // Merge custom volatility with defaults
    this.volatility = {
      ...DEFAULT_VOLATILITY,
      ...options?.volatility,
    };
  }

  /**
   * Generate correlated returns for a specific year
   */
  getReturns(year: number): ReturnsWithMetadata {
    // Generate independent standard normal random variables
    const independentRandoms = [this.rng.nextGaussian(), this.rng.nextGaussian(), this.rng.nextGaussian(), this.rng.nextGaussian()];

    // Apply Cholesky decomposition to create correlated random variables
    const correlatedRandoms = this.applyCorrelation(independentRandoms);

    // Extract user's expected returns (as decimals)
    const expectedStockReturn = this.inputs.marketAssumptions.stockReturn / 100;
    const expectedBondReturn = this.inputs.marketAssumptions.bondReturn / 100;
    const expectedCashReturn = this.inputs.marketAssumptions.cashReturn / 100;
    const expectedInflation = this.inputs.marketAssumptions.inflationRate / 100;

    // Generate nominal returns using appropriate distributions
    const nominalStockReturn = this.generateLogNormalReturn(expectedStockReturn, this.volatility.stocks, correlatedRandoms[0]);

    const nominalBondReturn = this.generateNormalReturn(expectedBondReturn, this.volatility.bonds, correlatedRandoms[1]);

    const nominalCashReturn = this.generateNormalReturn(expectedCashReturn, this.volatility.cash, correlatedRandoms[2]);

    const inflation = this.generateNormalReturn(expectedInflation, this.volatility.inflation, correlatedRandoms[3]);

    // Calculate real returns using Fisher equation
    const realStockReturn = (1 + nominalStockReturn) / (1 + inflation) - 1;
    const realBondReturn = (1 + nominalBondReturn) / (1 + inflation) - 1;
    const realCashReturn = (1 + nominalCashReturn) / (1 + inflation) - 1;

    return {
      returns: {
        stocks: realStockReturn,
        bonds: realBondReturn,
        cash: realCashReturn,
      },
      metadata: {
        inflationRate: inflation * 100, // Convert to percentage for metadata
      },
    };
  }

  /**
   * Apply correlation matrix using Cholesky decomposition
   */
  private applyCorrelation(independentRandoms: number[]): number[] {
    const correlated = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j <= i; j++) {
        correlated[i] += CHOLESKY_MATRIX[i][j] * independentRandoms[j];
      }
    }

    return correlated;
  }

  /**
   * Generate return from log-normal distribution
   * Used for equity returns to prevent negative values and model realistic fat tails
   */
  private generateLogNormalReturn(expectedReturn: number, volatility: number, z: number): number {
    // Convert expected return to log-normal parameters
    // E[R] = exp(μ + σ²/2) - 1, so μ = ln(1 + E[R]) - σ²/2
    const mu = Math.log(1 + expectedReturn) - 0.5 * volatility * volatility;
    const sigma = volatility;

    // Generate log-normal return
    return Math.exp(mu + sigma * z) - 1;
  }

  /**
   * Generate return from normal distribution
   * Used for bonds, cash, and inflation
   */
  private generateNormalReturn(expectedReturn: number, volatility: number, z: number): number {
    return expectedReturn + volatility * z;
  }

  /**
   * Reset the random number generator for a new scenario
   */
  resetForNewScenario(scenarioNumber: number): void {
    // Use scenario number to create unique seed for each scenario
    const newSeed = this.scenarioSeed + scenarioNumber * 1000;
    this.rng.reset(newSeed);
  }
}

/**
 * Factory function to create stochastic returns provider
 */
export function createStochasticReturnsProvider(
  inputs: QuickPlanInputs,
  options?: {
    seed?: number;
    volatility?: Partial<MarketVolatility>;
  }
): ReturnsProvider {
  return new StochasticReturnsProvider(inputs, options);
}
