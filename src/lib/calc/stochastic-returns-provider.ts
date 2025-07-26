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
    // Ensure seed is a positive integer within valid range
    this.seed = Math.floor(Math.abs(seed)) % 2147483648; // 2^31
    if (this.seed === 0) this.seed = 1;
  }

  /**
   * Generate next random number in the interval [0, 1)
   */
  next(): number {
    // LCG parameters (same as glibc)
    const a = 1103515245;
    const c = 12345;
    const m = 2147483648; // 2^31

    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Generate a random number from standard normal distribution (mean=0, std=1)
   * Uses Box-Muller transform
   */
  nextGaussian(): number {
    let u1;

    // Ensure u1 is not 0 to avoid log(0)
    do {
      u1 = this.next();
    } while (u1 === 0);

    const u2 = this.next();

    // Box-Muller transform
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0;
  }

  /**
   * Reset the generator with a new seed
   */
  reset(seed: number): void {
    // Apply same validation as constructor
    this.seed = Math.floor(Math.abs(seed)) % 2147483648; // 2^31
    if (this.seed === 0) this.seed = 1;
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
  stocks: 0.22, // 22% annual volatility
  bonds: 0.06, // 6% annual volatility
  cash: 0.01, // 1% annual volatility
  inflation: 0.03, // 3% annual volatility
};

/**
 * Correlation matrix for asset classes and inflation
 * Based on historical correlations
 */
const CORRELATION_MATRIX = [
  // Stocks, Bonds, Cash, Inflation
  [1.0, -0.1, 0.05, -0.15], // Stocks
  [-0.1, 1.0, 0.2, -0.3], // Bonds
  [0.05, 0.2, 1.0, 0.6], // Cash
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

  constructor(
    private inputs: QuickPlanInputs,
    private seed: number
  ) {
    // Initialize with required seed for this specific scenario
    this.rng = new SeededRandom(this.seed);

    // Use default volatility (custom volatility not allowed)
    this.volatility = DEFAULT_VOLATILITY;
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
    // E[R] = exp(μ + σ²/2) - 1, so μ = ln(1 + E[R]) - σ²/2 (Reference: https://www.statlect.com/probability-distributions/log-normal-distribution)
    const mu = Math.log(1 + expectedReturn) - 0.5 * volatility * volatility;

    // Generate log-normal return (Reference: https://en.wikipedia.org/wiki/Log-normal_distribution#Generation_and_parameters)
    return Math.exp(mu + volatility * z) - 1;
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
  resetForNewScenario(scenarioNumber: number): number {
    // Use scenario number to create unique seed for each scenario
    const newSeed = this.seed + scenarioNumber * 1000;
    this.rng.reset(newSeed);
    return newSeed;
  }
}
