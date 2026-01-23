import { describe, it, expect } from 'vitest';

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

import { StochasticReturnsProvider } from './stochastic-returns-provider';
import type { PhaseData } from '../phase';

describe('StochasticReturnsProvider', () => {
  const phaseData: PhaseData = {
    name: 'accumulation',
  };

  const defaultInputs: SimulatorInputs = {
    timeline: null,
    incomes: {},
    expenses: {},
    accounts: {},
    contributionRules: {},
    baseContributionRule: { type: 'save' },
    marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
    taxSettings: { filingStatus: 'single' },
    privacySettings: { isPrivate: true },
    simulationSettings: { simulationSeed: 9521, simulationMode: 'fixedReturns' },
  };

  describe('generateNormalReturn', () => {
    it('should apply normal distribution formula correctly', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateNormalReturn = StochasticReturnsProvider.prototype['generateNormalReturn'];

      const expectedReturn = 0.08; // 8%
      const volatility = 0.15; // 15%
      const zScore = 2; // 2 standard deviations above mean

      const result = generateNormalReturn.call(provider, expectedReturn, volatility, zScore);

      // Expected: 0.08 + 0.15 * 2 = 0.38
      expect(result).toBeCloseTo(0.38, 10);
    });

    it('should handle zero volatility correctly', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateNormalReturn = StochasticReturnsProvider.prototype['generateNormalReturn'];

      const expectedReturn = 0.05; // 5%
      const volatility = 0; // No volatility
      const zScore = 999; // Extreme z-score should have no effect

      const result = generateNormalReturn.call(provider, expectedReturn, volatility, zScore);

      // With zero volatility, result should always equal expected return
      expect(result).toBe(expectedReturn);
    });
  });

  describe('generateLogNormalReturn', () => {
    it('should apply log-normal distribution formula correctly and maintain constraints', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateLogNormalReturn = StochasticReturnsProvider.prototype['generateLogNormalReturn'];

      const expectedReturn = 0.1; // 10%
      const volatility = 0.18; // 18%
      const zScore = -3; // Extreme negative event

      const result = generateLogNormalReturn.call(provider, expectedReturn, volatility, zScore);

      // Calculate expected value using the corrected log-normal formula
      const mean = 1 + expectedReturn;
      const variance = volatility * volatility;
      const sigma = Math.sqrt(Math.log(1 + variance / (mean * mean)));
      const mu = Math.log(mean) - 0.5 * sigma * sigma;
      const expectedValue = Math.exp(mu + sigma * zScore) - 1;

      // Verify the exact calculation
      expect(result).toBeCloseTo(expectedValue, 10);

      // Verify log-normal constraint: returns > -100%
      expect(result).toBeGreaterThan(-1);
    });

    it('should handle zero volatility by returning expected return', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateLogNormalReturn = StochasticReturnsProvider.prototype['generateLogNormalReturn'];

      const expectedReturn = 0.12; // 12%
      const volatility = 0; // No volatility
      const zScore = -5; // Extreme z-score should have no effect

      const result = generateLogNormalReturn.call(provider, expectedReturn, volatility, zScore);

      // With zero volatility: mu = ln(1 + E[R]), result = exp(mu) - 1 = E[R]
      expect(result).toBeCloseTo(expectedReturn, 10);
    });
  });

  it('should produce log-normal distribution with correct statistical properties', () => {
    const provider = new StochasticReturnsProvider(defaultInputs, 54321);
    const generateLogNormalReturn = StochasticReturnsProvider.prototype['generateLogNormalReturn'];

    const expectedReturn = 0.1; // 10%
    const volatility = 0.18; // 18%
    const numSamples = 10000;

    const returns: number[] = [];
    const logReturns: number[] = [];

    // Generate samples using Box-Muller for z-scores
    for (let i = 0; i < numSamples; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      const r = generateLogNormalReturn.call(provider, expectedReturn, volatility, z);
      returns.push(r);
      logReturns.push(Math.log(1 + r));
    }

    // Verify mean and std dev match inputs
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / numSamples;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / numSamples;
    const stdDev = Math.sqrt(variance);

    expect(meanReturn).toBeCloseTo(expectedReturn, 2);
    expect(stdDev).toBeCloseTo(volatility, 2);

    // Verify all returns > -100%
    expect(Math.min(...returns)).toBeGreaterThan(-1);

    // Verify log-returns follow normal distribution
    const meanLog = logReturns.reduce((sum, lr) => sum + lr, 0) / numSamples;
    const logStdDev = Math.sqrt(logReturns.reduce((sum, lr) => sum + Math.pow(lr - meanLog, 2), 0) / numSamples);

    const within1Sigma = logReturns.filter((lr) => Math.abs(lr - meanLog) <= logStdDev).length / numSamples;
    expect(within1Sigma).toBeCloseTo(0.68, 1);

    // Verify positive skewness (characteristic of log-normal)
    const skewness = returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / stdDev, 3), 0) / numSamples;
    expect(skewness).toBeGreaterThan(0);
  });

  it('should handle extreme parameter combinations correctly', () => {
    const provider = new StochasticReturnsProvider(defaultInputs, 12345);
    const generateLogNormalReturn = StochasticReturnsProvider.prototype['generateLogNormalReturn'];

    // High volatility, low expected return (stress scenario)
    const result1 = generateLogNormalReturn.call(provider, 0.02, 0.5, -2);
    expect(result1).toBeGreaterThan(-1);
    expect(isFinite(result1)).toBe(true);

    // Negative expected return with volatility (bear market)
    const result2 = generateLogNormalReturn.call(provider, -0.05, 0.3, 1);
    expect(result2).toBeGreaterThan(-1);
    expect(isFinite(result2)).toBe(true);

    // Very high expected return (unlikely but possible input)
    const result3 = generateLogNormalReturn.call(provider, 0.5, 0.4, 0);
    expect(result3).toBeGreaterThan(-1);
    expect(isFinite(result3)).toBe(true);

    // Verify formula still works correctly with extreme inputs
    const mean = 1 + 0.5;
    const variance = 0.4 * 0.4;
    const sigma = Math.sqrt(Math.log(1 + variance / (mean * mean)));
    const mu = Math.log(mean) - 0.5 * sigma * sigma;
    const expected = Math.exp(mu + sigma * 0) - 1;
    expect(result3).toBeCloseTo(expected, 10);
  });

  describe('getReturns integration', () => {
    it('should produce deterministic results with seeded random generation', () => {
      const provider1 = new StochasticReturnsProvider(defaultInputs, 999);
      const provider2 = new StochasticReturnsProvider(defaultInputs, 999);

      const result1 = provider1.getReturns(phaseData); // Year 1 of simulation
      const result2 = provider2.getReturns(phaseData); // Year 1 of simulation

      expect(result1.returns.stocks).toBe(result2.returns.stocks);
      expect(result1.returns.bonds).toBe(result2.returns.bonds);
      expect(result1.returns.cash).toBe(result2.returns.cash);
      expect(result1.inflationRate).toBe(result2.inflationRate);
    });

    it('should converge to expected statistical properties across many simulations', () => {
      const inputs = {
        ...defaultInputs,
        marketAssumptions: {
          stockReturn: 10,
          stockYield: 3,
          bondReturn: 5,
          bondYield: 3,
          cashReturn: 3,
          inflationRate: 2.5,
          simulationMode: 'monteCarlo' as const,
        },
      };

      const baseSeed = 42;
      const numSimulations = 10000;

      const returns = {
        stocks: [] as number[],
        bonds: [] as number[],
        cash: [] as number[],
        inflation: [] as number[],
      };

      // Collect returns from many simulations (multiple years per scenario)
      const yearsPerScenario = 30; // Typical retirement simulation length
      const numScenarios = Math.floor(numSimulations / yearsPerScenario);

      for (let scenario = 0; scenario < numScenarios; scenario++) {
        const scenarioSeed = baseSeed + scenario * 1009;
        const scenarioProvider = new StochasticReturnsProvider(inputs, scenarioSeed);

        // Simulate multiple years within each scenario
        for (let year = 1; year <= yearsPerScenario; year++) {
          const result = scenarioProvider.getReturns(phaseData);

          // Convert real returns back to nominal for statistical analysis
          const nominalStock = (1 + result.returns.stocks) * (1 + result.inflationRate / 100) - 1;
          const nominalBond = (1 + result.returns.bonds) * (1 + result.inflationRate / 100) - 1;
          const nominalCash = (1 + result.returns.cash) * (1 + result.inflationRate / 100) - 1;

          returns.stocks.push(nominalStock);
          returns.bonds.push(nominalBond);
          returns.cash.push(nominalCash);
          returns.inflation.push(result.inflationRate / 100);
        }
      }

      // Calculate means
      const totalDataPoints = returns.stocks.length;
      const meanStock = returns.stocks.reduce((sum, val) => sum + val, 0) / totalDataPoints;
      const meanBond = returns.bonds.reduce((sum, val) => sum + val, 0) / totalDataPoints;
      const meanCash = returns.cash.reduce((sum, val) => sum + val, 0) / totalDataPoints;
      const meanInflation = returns.inflation.reduce((sum, val) => sum + val, 0) / totalDataPoints;

      // Calculate standard deviations
      const calcStdDev = (values: number[], mean: number) => {
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
      };

      const stockStdDev = calcStdDev(returns.stocks, meanStock);
      const bondStdDev = calcStdDev(returns.bonds, meanBond);
      const cashStdDev = calcStdDev(returns.cash, meanCash);
      const inflationStdDev = calcStdDev(returns.inflation, meanInflation);

      // Calculate key correlations
      const calcCorrelation = (x: number[], y: number[]) => {
        const n = x.length;
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = y.reduce((sum, val) => sum + val, 0) / n;

        let numerator = 0;
        let denomX = 0;
        let denomY = 0;

        for (let i = 0; i < n; i++) {
          const dx = x[i] - meanX;
          const dy = y[i] - meanY;
          numerator += dx * dy;
          denomX += dx * dx;
          denomY += dy * dy;
        }

        return numerator / Math.sqrt(denomX * denomY);
      };

      const stockBondCorr = calcCorrelation(returns.stocks, returns.bonds);
      const stockInflationCorr = calcCorrelation(returns.stocks, returns.inflation);
      const bondInflationCorr = calcCorrelation(returns.bonds, returns.inflation);
      const cashInflationCorr = calcCorrelation(returns.cash, returns.inflation);

      // Verify means converge to expected values
      expect(meanStock).toBeCloseTo(0.1);
      expect(meanBond).toBeCloseTo(0.05);
      expect(meanCash).toBeCloseTo(0.03);
      expect(meanInflation).toBeCloseTo(0.025);

      // Verify standard deviations match expected volatilities
      expect(stockStdDev).toBeCloseTo(0.18);
      expect(bondStdDev).toBeCloseTo(0.06);
      expect(cashStdDev).toBeCloseTo(0.03);
      expect(inflationStdDev).toBeCloseTo(0.04);

      // Verify correlation structure (from MODERN_CORRELATION_MATRIX)
      //   [1.0, -0.1, 0.07, -0.02, 0.02, -0.27], // StockReturn
      //   [-0.1, 1.0, 0.21, -0.33, 0.04, 0.23],  // BondReturn
      //   [0.07, 0.21, 1.0, 0.31, 0.81, 0.14],   // CashReturn
      //   [-0.02, -0.33, 0.31, 1.0, 0.26, 0.01], // Inflation
      //   [0.02, 0.04, 0.81, 0.26, 1.0, 0.36],   // BondYield
      //   [-0.27, 0.23, 0.14, 0.01, 0.36, 1.0],  // StockYield
      expect(stockBondCorr).toBeCloseTo(-0.1, 1);
      expect(stockInflationCorr).toBeCloseTo(-0.02, 1);
      expect(bondInflationCorr).toBeCloseTo(-0.33, 1);
      expect(cashInflationCorr).toBeCloseTo(0.31, 1);

      // Verify return constraints
      const minStockReturn = Math.min(...returns.stocks);
      const minBondReturn = Math.min(...returns.bonds);
      const minCashReturn = Math.min(...returns.cash);
      const minInflationRate = Math.min(...returns.inflation);

      // Log-normal constraint for stocks (mathematically guaranteed)
      expect(minStockReturn).toBeGreaterThan(-1);

      // Normal distributions should statistically never hit -100% with our volatility parameters
      expect(minBondReturn).toBeGreaterThan(-1); // Bonds: 5% mean, 6% vol
      expect(minCashReturn).toBeGreaterThan(-1); // Cash: 3% mean, 3% vol
      expect(minInflationRate).toBeGreaterThan(-1); // Inflation: 2.5% mean, 4% vol

      // Test distribution properties for normal distributions (bonds, cash, inflation)
      const testDistributionProperties = (values: number[], mean: number, stdDev: number, name: string) => {
        const within1Sigma = values.filter((val) => Math.abs(val - mean) <= stdDev).length / values.length;
        const within2Sigma = values.filter((val) => Math.abs(val - mean) <= 2 * stdDev).length / values.length;
        const within3Sigma = values.filter((val) => Math.abs(val - mean) <= 3 * stdDev).length / values.length;

        // Allow for sampling variation with generous tolerances
        expect(within1Sigma).toBeGreaterThan(0.6); // Should be ~68%, allow 60%+
        expect(within1Sigma).toBeLessThan(0.75); // Should be ~68%, allow <75%

        expect(within2Sigma).toBeGreaterThan(0.9); // Should be ~95%, allow 90%+
        expect(within2Sigma).toBeLessThan(0.98); // Should be ~95%, allow <98%

        expect(within3Sigma).toBeGreaterThan(0.995); // Should be ~99.7%, allow 99.5%+
      };

      // Test normal distributions (bonds, cash, inflation)
      testDistributionProperties(returns.bonds, meanBond, bondStdDev, 'bonds');
      testDistributionProperties(returns.cash, meanCash, cashStdDev, 'cash');
      testDistributionProperties(returns.inflation, meanInflation, inflationStdDev, 'inflation');

      // Test log-normal distribution for stocks
      // For log-normal, ln(1 + return) should follow normal distribution
      const logStockReturns = returns.stocks.map((r) => Math.log(1 + r));
      const meanLogStock = logStockReturns.reduce((sum, val) => sum + val, 0) / logStockReturns.length;
      const logStockStdDev = calcStdDev(logStockReturns, meanLogStock);

      // The log of stock returns should follow normal distribution properties
      testDistributionProperties(logStockReturns, meanLogStock, logStockStdDev, 'log-stocks');
    });

    it('should generate yields with correct lognormal distribution properties', () => {
      const inputs = {
        ...defaultInputs,
        marketAssumptions: {
          stockReturn: 10,
          stockYield: 3.5,
          bondReturn: 5,
          bondYield: 4.5,
          cashReturn: 3,
          inflationRate: 2.5,
          simulationMode: 'monteCarlo' as const,
        },
      };

      const baseSeed = 42;
      const numSimulations = 10000;

      const yields = {
        bondYield: [] as number[],
        stockYield: [] as number[],
        inflation: [] as number[],
      };

      // Collect yields from many simulations
      const yearsPerScenario = 30;
      const numScenarios = Math.floor(numSimulations / yearsPerScenario);

      for (let scenario = 0; scenario < numScenarios; scenario++) {
        const scenarioSeed = baseSeed + scenario * 1009;
        const scenarioProvider = new StochasticReturnsProvider(inputs, scenarioSeed);

        for (let year = 1; year <= yearsPerScenario; year++) {
          const result = scenarioProvider.getReturns(phaseData);

          yields.bondYield.push(result.yields.bonds / 100);
          yields.stockYield.push(result.yields.stocks / 100);
          yields.inflation.push(result.inflationRate / 100);
        }
      }

      // Calculate means
      const totalDataPoints = yields.bondYield.length;
      const meanBondYield = yields.bondYield.reduce((sum, val) => sum + val, 0) / totalDataPoints;
      const meanStockYield = yields.stockYield.reduce((sum, val) => sum + val, 0) / totalDataPoints;

      // Calculate standard deviations
      const calcStdDev = (values: number[], mean: number) => {
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
      };

      const bondYieldStdDev = calcStdDev(yields.bondYield, meanBondYield);
      const stockYieldStdDev = calcStdDev(yields.stockYield, meanStockYield);

      // Verify means converge to expected values
      expect(meanBondYield).toBeCloseTo(0.045); // 4.5%
      expect(meanStockYield).toBeCloseTo(0.035); // 3.5%

      // Verify standard deviations match expected volatilities (from DEFAULT_VOLATILITY)
      expect(bondYieldStdDev).toBeCloseTo(0.015); // 1.5% volatility
      expect(stockYieldStdDev).toBeCloseTo(0.01); // 1% volatility

      // Test lognormal constraints - yields should always be >= 0
      const minBondYield = Math.min(...yields.bondYield);
      const minStockYield = Math.min(...yields.stockYield);

      expect(minBondYield).toBeGreaterThanOrEqual(0);
      expect(minStockYield).toBeGreaterThanOrEqual(0);

      // Verify no yields exceeded reasonable bounds (e.g., < 100%)
      const maxBondYield = Math.max(...yields.bondYield);
      const maxStockYield = Math.max(...yields.stockYield);

      expect(maxBondYield).toBeLessThan(1.0); // Less than 100%
      expect(maxStockYield).toBeLessThan(1.0); // Less than 100%
    });
  });

  describe('generateLogNormalYield edge cases', () => {
    it('should return 0 when expected yield is 0', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateLogNormalYield = StochasticReturnsProvider.prototype['generateLogNormalYield'];

      const result = generateLogNormalYield.call(provider, 0, 0.01, 2);

      expect(result).toBe(0);
    });

    it('should return 0 when expected yield is negative', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateLogNormalYield = StochasticReturnsProvider.prototype['generateLogNormalYield'];

      const result = generateLogNormalYield.call(provider, -0.05, 0.01, 1);

      expect(result).toBe(0);
    });

    it('should always return non-negative values for positive expected yields', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateLogNormalYield = StochasticReturnsProvider.prototype['generateLogNormalYield'];

      // Test with extreme negative z-scores
      const extremeZScores = [-10, -5, -3, -2, -1, 0, 1, 2, 3, 5, 10];

      for (const z of extremeZScores) {
        const result = generateLogNormalYield.call(provider, 0.03, 0.01, z);
        expect(result).toBeGreaterThan(0);
      }
    });

    it('should return expected yield when volatility is 0', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateLogNormalYield = StochasticReturnsProvider.prototype['generateLogNormalYield'];

      const expectedYield = 0.045;
      const result = generateLogNormalYield.call(provider, expectedYield, 0, 5);

      expect(result).toBeCloseTo(expectedYield, 10);
    });

    it('should handle very small positive expected yields without numerical issues', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const generateLogNormalYield = StochasticReturnsProvider.prototype['generateLogNormalYield'];

      const tinyYield = 0.0001; // 0.01%
      const result = generateLogNormalYield.call(provider, tinyYield, 0.00005, 0);

      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });
  });
});
