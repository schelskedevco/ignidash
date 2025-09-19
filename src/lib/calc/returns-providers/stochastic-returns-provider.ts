import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { ReturnsProvider, ReturnsWithMetadata } from './returns-provider';
import { SeededRandom } from './seeded-random';

interface MarketVolatility {
  stocks: number;
  bonds: number;
  cash: number;
  inflation: number;
}

/**
 * Default historical volatility parameters
 * Based on long-term historical data
 */
const DEFAULT_VOLATILITY: MarketVolatility = {
  stocks: 0.2,
  bonds: 0.06,
  cash: 0.01,
  inflation: 0.03,
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

  getReturns(): ReturnsWithMetadata {
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
      returns: { stocks: realStockReturn, bonds: realBondReturn, cash: realCashReturn },
      metadata: { inflationRate: inflation * 100 },
    };
  }

  /**
   * Apply correlation matrix using Cholesky decomposition
   *
   * @param independentRandoms - Array of 4 independent standard normal random variables
   * @returns Array of 4 correlated random variables for [stocks, bonds, cash, inflation]
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
   *
   * @param expectedReturn - Expected return rate as a decimal (e.g., 0.1 for 10%)
   * @param volatility - Annual volatility as a decimal (e.g., 0.2 for 20%)
   * @param z - Standard normal random variable
   * @returns Log-normal distributed return rate as a decimal
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
