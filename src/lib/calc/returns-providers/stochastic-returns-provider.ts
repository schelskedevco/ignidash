/**
 * Stochastic returns provider for Monte Carlo simulations
 *
 * Generates correlated random returns using Cholesky decomposition of a
 * historical correlation matrix. Stock returns use log-normal distribution;
 * bonds, cash, and inflation use normal distribution.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

import { ReturnsProvider, type ReturnsProviderData } from './returns-provider';
import { SeededRandom } from './seeded-random';
import type { PhaseData } from '../phase';

interface MarketVolatility {
  stockReturn: number;
  bondReturn: number;
  cashReturn: number;
  inflation: number;
  bondYield: number;
  stockYield: number;
}

/**
 * Default historical volatility parameters
 * Annualized standard deviations derived from NYU Stern historical data (1928-2024)
 */
const DEFAULT_VOLATILITY: MarketVolatility = {
  stockReturn: 0.18,
  bondReturn: 0.06,
  cashReturn: 0.03,
  inflation: 0.04,
  bondYield: 0.015,
  stockYield: 0.01,
};

/**
 * Student's t-distribution degrees of freedom for fat tail modeling.
 * df=8 gives excess kurtosis of 6/(8-4) = 1.5, matching annual US stock data.
 */
const T_DISTRIBUTION_DF = 8;

/**
 * Volatility correction factor to preserve unconditional standard deviations
 * when using t-distribution. The t-distribution inflates variance by df/(df-2),
 * so we scale volatility down by sqrt((df-2)/df).
 */
const T_VOLATILITY_CORRECTION = Math.sqrt((T_DISTRIBUTION_DF - 2) / T_DISTRIBUTION_DF);

/**
 * AR(1) autocorrelation coefficient for inflation persistence.
 * Derived from historical CPI data — high inflation tends to persist across years.
 */
const INFLATION_AR1_RHO = 0.65;

/**
 * Full-period correlation matrix for asset classes and inflation
 * Computed from NYU Stern/Shiller historical data (1928-2024)
 */
const _CORRELATION_MATRIX = [
  // StockReturn, BondReturn, CashReturn, Inflation, BondYield, StockYield
  [1.0, 0.02, -0.03, 0.01, 0.02, -0.29], // StockReturn
  [0.02, 1.0, 0.27, -0.11, 0.2, -0.06], // BondReturn
  [-0.03, 0.27, 1.0, 0.38, 0.93, -0.01], // CashReturn
  [0.01, -0.11, 0.38, 1.0, 0.39, -0.02], // Inflation
  [0.02, 0.2, 0.93, 0.39, 1.0, 0.01], // BondYield
  [-0.29, -0.06, -0.01, -0.02, 0.01, 1.0], // StockYield
];

/**
 * Modern-era correlation matrix for asset classes and inflation
 * Computed from NYU Stern/Shiller historical data (1990-2024)
 */
const MODERN_CORRELATION_MATRIX = [
  // StockReturn, BondReturn, CashReturn, Inflation, BondYield, StockYield
  [1.0, -0.1, 0.07, -0.02, 0.02, -0.27], // StockReturn
  [-0.1, 1.0, 0.21, -0.33, 0.04, 0.23], // BondReturn
  [0.07, 0.21, 1.0, 0.31, 0.81, 0.14], // CashReturn
  [-0.02, -0.33, 0.31, 1.0, 0.26, 0.01], // Inflation
  [0.02, 0.04, 0.81, 0.26, 1.0, 0.36], // BondYield
  [-0.27, 0.23, 0.14, 0.01, 0.36, 1.0], // StockYield
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
const CHOLESKY_MATRIX = computeCholeskyDecomposition(MODERN_CORRELATION_MATRIX);

/** Generates correlated random returns from user expectations and historical volatility */
export class StochasticReturnsProvider implements ReturnsProvider {
  private rng: SeededRandom;
  private volatility: MarketVolatility;
  private previousInflation: number;

  /**
   * @param inputs - Simulator inputs containing expected return assumptions
   * @param seed - Seed for reproducible random number generation
   */
  constructor(
    private inputs: SimulatorInputs,
    private seed: number
  ) {
    this.rng = new SeededRandom(this.seed);
    this.volatility = {
      stockReturn: DEFAULT_VOLATILITY.stockReturn * T_VOLATILITY_CORRECTION,
      bondReturn: DEFAULT_VOLATILITY.bondReturn * T_VOLATILITY_CORRECTION,
      cashReturn: DEFAULT_VOLATILITY.cashReturn * T_VOLATILITY_CORRECTION,
      inflation: DEFAULT_VOLATILITY.inflation * T_VOLATILITY_CORRECTION,
      bondYield: DEFAULT_VOLATILITY.bondYield * T_VOLATILITY_CORRECTION,
      stockYield: DEFAULT_VOLATILITY.stockYield * T_VOLATILITY_CORRECTION,
    };
    this.previousInflation = this.inputs.marketAssumptions.inflationRate / 100;
  }

  /**
   * Generates correlated stochastic returns for a simulation year
   * @param phaseData - Current simulation phase (unused for stochastic returns)
   * @returns Randomly generated real returns, nominal yields, and inflation
   */
  getReturns(phaseData: PhaseData | null): ReturnsProviderData {
    // Generate independent standard normal random variables
    const independentRandoms = Array(6)
      .fill(null)
      .map(() => this.rng.nextGaussian());

    // Apply Cholesky decomposition to create correlated random variables
    const correlatedNormals = this.applyCorrelation(independentRandoms);

    // Scale correlated normals into multivariate t-distribution for fat tails.
    // A single scalar preserves tail dependence — when one asset crashes, they all tend to.
    const w = this.rng.nextChiSquared(T_DISTRIBUTION_DF);
    const tScale = Math.sqrt(T_DISTRIBUTION_DF / w);
    const correlatedRandoms = correlatedNormals.map((z) => z * tScale);

    // Extract user's expected returns (as decimals)
    const expectedStockReturn = this.inputs.marketAssumptions.stockReturn / 100;
    const expectedBondReturn = this.inputs.marketAssumptions.bondReturn / 100;
    const expectedCashReturn = this.inputs.marketAssumptions.cashReturn / 100;
    const expectedInflation = this.inputs.marketAssumptions.inflationRate / 100;
    const expectedBondYield = this.inputs.marketAssumptions.bondYield / 100;
    const expectedStockYield = this.inputs.marketAssumptions.stockYield / 100;

    // Generate nominal returns and yields using appropriate distributions
    const nominalStockReturn = this.generateLogNormalReturn(expectedStockReturn, this.volatility.stockReturn, correlatedRandoms[0]);
    const nominalBondReturn = this.generateNormalReturn(expectedBondReturn, this.volatility.bondReturn, correlatedRandoms[1]);
    const nominalCashReturn = this.generateNormalReturn(expectedCashReturn, this.volatility.cashReturn, correlatedRandoms[2]);
    const inflation = this.generateAR1Inflation(expectedInflation, correlatedRandoms[3]);
    const nominalBondYield = this.generateLogNormalYield(expectedBondYield, this.volatility.bondYield, correlatedRandoms[4]);
    const nominalStockYield = this.generateLogNormalYield(expectedStockYield, this.volatility.stockYield, correlatedRandoms[5]);

    // Calculate real returns using Fisher equation
    const realStockReturn = (1 + nominalStockReturn) / (1 + inflation) - 1;
    const realBondReturn = (1 + nominalBondReturn) / (1 + inflation) - 1;
    const realCashReturn = (1 + nominalCashReturn) / (1 + inflation) - 1;

    return {
      returns: { stocks: realStockReturn, bonds: realBondReturn, cash: realCashReturn },
      yields: { stocks: nominalStockYield, bonds: nominalBondYield, cash: nominalCashReturn },
      inflationRate: inflation,
    };
  }

  /**
   * Apply correlation matrix using Cholesky decomposition
   *
   * @param independentRandoms - Array of 6 independent standard normal random variables
   * @returns Array of 6 correlated random variables for [stocks, bonds, cash, inflation, bondYield, stockYield]
   */
  private applyCorrelation(independentRandoms: number[]): number[] {
    const correlated = [0, 0, 0, 0, 0, 0];

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j <= i; j++) {
        correlated[i] += CHOLESKY_MATRIX[i][j] * independentRandoms[j];
      }
    }

    return correlated;
  }

  /**
   * Generate return from log-normal distribution
   *
   * @param expectedReturn - Arithmetic mean of historical annual returns (e.g., 0.1 for 10%)
   * @param volatility - Standard deviation of historical annual arithmetic returns (e.g., 0.2 for 20%)
   * @param z - Standard normal random variable
   * @returns Log-normal distributed return rate as a decimal
   *
   * Note: Converts arithmetic moments to log-space parameters assuming
   * the gross return (1+R) follows a log-normal distribution
   */
  private generateLogNormalReturn(expectedReturn: number, volatility: number, z: number): number {
    // Reference: https://en.wikipedia.org/wiki/Log-normal_distribution#Generation_and_parameters
    // Reference: https://www.statlect.com/probability-distributions/log-normal-distribution
    const mean = 1 + expectedReturn;
    const variance = volatility * volatility;

    // Convert arithmetic moments to log-space parameters
    // Given E[Y] and Var[Y], the log-space parameters are:
    // σ² = ln(1 + Var/Mean²) and μ = ln(Mean) - σ²/2
    const sigmaLog = Math.sqrt(Math.log(1 + variance / (mean * mean)));
    const mu = Math.log(mean) - 0.5 * sigmaLog * sigmaLog;

    // Generate log-normal return
    return Math.exp(mu + sigmaLog * z) - 1;
  }

  /**
   * Generate a non-negative yield from log-normal distribution
   * Used for bond and stock yields which cannot be negative
   *
   * @param expectedYield - Arithmetic mean of historical annual yields (e.g., 0.03 for 3%)
   * @param volatility - Standard deviation of historical annual arithmetic yields (e.g., 0.01 for 1%)
   * @param z - Standard normal random variable
   * @returns Log-normal distributed yield as a decimal (always >= 0)
   *
   * Note: Converts arithmetic moments to log-space parameters assuming
   * the yield follows a log-normal distribution
   */
  private generateLogNormalYield(expectedYield: number, volatility: number, z: number): number {
    if (expectedYield <= 0) return 0;

    const mean = expectedYield;
    const variance = volatility * volatility;

    // Convert arithmetic moments to log-space parameters
    // Given E[Y] and Var[Y], the log-space parameters are:
    // σ² = ln(1 + Var/Mean²) and μ = ln(Mean) - σ²/2
    const sigmaLog = Math.sqrt(Math.log(1 + variance / (mean * mean)));
    const mu = Math.log(mean) - 0.5 * sigmaLog * sigmaLog;

    // Generate log-normal yield (always positive)
    return Math.exp(mu + sigmaLog * z);
  }

  /**
   * Generate inflation using AR(1) process for persistence
   * inflation_t = (1 - rho) * mu + rho * inflation_{t-1} + sigma_epsilon * z_t
   *
   * @param expectedInflation - Long-run mean inflation (user's expected rate)
   * @param z - Correlated random variable (already t-scaled)
   * @returns AR(1) inflation rate as a decimal
   */
  private generateAR1Inflation(expectedInflation: number, z: number): number {
    // Innovation std dev — preserves unconditional variance
    const sigmaEpsilon = this.volatility.inflation * Math.sqrt(1 - INFLATION_AR1_RHO * INFLATION_AR1_RHO);

    const inflation = (1 - INFLATION_AR1_RHO) * expectedInflation + INFLATION_AR1_RHO * this.previousInflation + sigmaEpsilon * z;

    this.previousInflation = inflation;
    return inflation;
  }

  /**
   * Generate return from normal distribution
   * Used for bonds and cash
   *
   * @param expectedReturn - Expected return rate as a decimal (e.g., 0.05 for 5%)
   * @param volatility - Annual volatility as a decimal (e.g., 0.06 for 6%)
   * @param z - Standard normal random variable
   * @returns Normal distributed return rate as a decimal
   */
  private generateNormalReturn(expectedReturn: number, volatility: number, z: number): number {
    return expectedReturn + volatility * z;
  }
}
