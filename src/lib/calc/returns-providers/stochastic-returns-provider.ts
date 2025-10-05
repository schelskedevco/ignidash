import type { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { ReturnsProvider, type ReturnsWithMetadata } from './returns-provider';
import { SeededRandom } from './seeded-random';
import type { PhaseData } from '../v2/phase';

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
 * Based on long-term historical data
 */
const DEFAULT_VOLATILITY: MarketVolatility = {
  stockReturn: 0.18,
  bondReturn: 0.06,
  cashReturn: 0.03,
  inflation: 0.04,
  bondYield: 0.03,
  stockYield: 0.02,
};

/**
 * Correlation matrix for asset classes and inflation
 * Based on historical correlations
 */
const _CORRELATION_MATRIX = [
  // StockReturn, BondReturn, CashReturn, Inflation, BondYield, StockYield
  [1.0, 0.02, -0.03, 0.01, 0.02, -0.29], // StockReturn
  [0.02, 1.0, 0.27, -0.11, 0.2, -0.06], // BondReturn
  [-0.03, 0.27, 1.0, 0.38, 0.93, -0.01], // CashReturn
  [0.01, -0.11, 0.38, 1.0, 0.39, -0.02], // Inflation
  [0.02, 0.2, 0.93, 0.39, 1.0, 0.01], // BondYield
  [-0.29, -0.06, -0.01, -0.02, 0.01, 1.0], // StockYield
]; // Since 1928

const MODERN_CORRELATION_MATRIX = [
  // StockReturn, BondReturn, CashReturn, Inflation, BondYield, StockYield
  [1.0, -0.1, 0.07, -0.02, 0.02, -0.27], // StockReturn
  [-0.1, 1.0, 0.21, -0.33, 0.04, 0.23], // BondReturn
  [0.07, 0.21, 1.0, 0.31, 0.81, 0.14], // CashReturn
  [-0.02, -0.33, 0.31, 1.0, 0.26, 0.01], // Inflation
  [0.02, 0.04, 0.81, 0.26, 1.0, 0.36], // BondYield
  [-0.27, 0.23, 0.14, 0.01, 0.36, 1.0], // StockYield
]; // Since 1990

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

export class StochasticReturnsProvider implements ReturnsProvider {
  private rng: SeededRandom;
  private volatility: MarketVolatility;

  constructor(
    private inputs: QuickPlanInputs,
    private seed: number
  ) {
    this.rng = new SeededRandom(this.seed);
    this.volatility = DEFAULT_VOLATILITY;
  }

  getReturns(phaseData: PhaseData | null): ReturnsWithMetadata {
    // Generate independent standard normal random variables
    const independentRandoms = Array(6)
      .fill(null)
      .map(() => this.rng.nextGaussian());

    // Apply Cholesky decomposition to create correlated random variables
    const correlatedRandoms = this.applyCorrelation(independentRandoms);

    // Extract user's expected returns (as decimals)
    const expectedStockReturn = this.inputs.marketAssumptions.stockReturn / 100;
    const expectedBondReturn = this.inputs.marketAssumptions.bondReturn / 100;
    const expectedCashReturn = this.inputs.marketAssumptions.cashReturn / 100;
    const expectedInflation = this.inputs.marketAssumptions.inflationRate / 100;
    const expectedBondYield = this.inputs.marketAssumptions.bondYield / 100;
    const expectedStockYield = this.inputs.marketAssumptions.stockYield / 100;

    // Generate nominal returns using appropriate distributions
    const nominalStockReturn = this.generateLogNormalReturn(expectedStockReturn, this.volatility.stockReturn, correlatedRandoms[0]);
    const nominalBondReturn = this.generateNormalReturn(expectedBondReturn, this.volatility.bondReturn, correlatedRandoms[1]);
    const nominalCashReturn = this.generateNormalReturn(expectedCashReturn, this.volatility.cashReturn, correlatedRandoms[2]);
    const inflation = this.generateNormalReturn(expectedInflation, this.volatility.inflation, correlatedRandoms[3]);

    // Generate yields - use normal distribution with bounds
    const nominalBondYield = Math.max(0, this.generateNormalReturn(expectedBondYield, this.volatility.bondYield, correlatedRandoms[4]));
    const nominalStockYield = Math.max(0, this.generateNormalReturn(expectedStockYield, this.volatility.stockYield, correlatedRandoms[5]));

    // Calculate real returns using Fisher equation
    const realStockReturn = (1 + nominalStockReturn) / (1 + inflation) - 1;
    const realBondReturn = (1 + nominalBondReturn) / (1 + inflation) - 1;
    const realCashReturn = (1 + nominalCashReturn) / (1 + inflation) - 1;

    // Calculate real yields using Fisher equation
    const realBondYield = (1 + nominalBondYield) / (1 + inflation) - 1;
    const realStockYield = (1 + nominalStockYield) / (1 + inflation) - 1;

    return {
      returns: { stocks: realStockReturn, bonds: realBondReturn, cash: realCashReturn },
      metadata: { inflationRate: inflation * 100, bondYield: realBondYield * 100, stockYield: realStockYield * 100 },
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
   * @param expectedReturn - Expected return rate as a decimal (e.g., 0.1 for 10%)
   * @param volatility - Annual volatility as a decimal (e.g., 0.2 for 20%)
   * @param z - Standard normal random variable
   * @returns Log-normal distributed return rate as a decimal
   */
  private generateLogNormalReturn(expectedReturn: number, volatility: number, z: number): number {
    const mean = 1 + expectedReturn;
    const variance = volatility * volatility;

    // Convert expected return to log-normal parameters
    // E[R] = exp(μ + σ²/2) - 1, so μ = ln(1 + E[R]) - σ²/2 (Reference: https://www.statlect.com/probability-distributions/log-normal-distribution)
    const sigmaLog = Math.sqrt(Math.log(1 + variance / (mean * mean)));
    const mu = Math.log(mean) - 0.5 * sigmaLog * sigmaLog;

    // Generate log-normal return (Reference: https://en.wikipedia.org/wiki/Log-normal_distribution#Generation_and_parameters)
    return Math.exp(mu + sigmaLog * z) - 1;
  }

  /**
   * Generate a non-negative yield from log-normal distribution
   * Used for bond and stock yields which cannot be negative
   *
   * @param expectedYield - Expected yield as a decimal (e.g., 0.03 for 3%)
   * @param volatility - Annual volatility as a decimal (e.g., 0.03 for 3%)
   * @param z - Standard normal random variable
   * @returns Log-normal distributed yield as a decimal (always >= 0)
   */
  private generateLogNormalYield(expectedYield: number, volatility: number, z: number): number {
    const mean = expectedYield;
    const variance = volatility * volatility;

    // Convert arithmetic volatility to log-space parameters
    // E[Y] = exp(μ + σ²/2), so:
    const sigmaLog = Math.sqrt(Math.log(1 + variance / (mean * mean)));
    const mu = Math.log(mean) - 0.5 * sigmaLog * sigmaLog;

    // Generate log-normal yield (always positive)
    return Math.exp(mu + sigmaLog * z);
  }

  /**
   * Generate return from normal distribution
   * Used for bonds, cash, and inflation
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
