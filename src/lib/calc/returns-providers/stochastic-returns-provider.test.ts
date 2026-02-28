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
    debts: {},
    physicalAssets: {},
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
          const nominalStock = (1 + result.returns.stocks) * (1 + result.inflationRate) - 1;
          const nominalBond = (1 + result.returns.bonds) * (1 + result.inflationRate) - 1;
          const nominalCash = (1 + result.returns.cash) * (1 + result.inflationRate) - 1;

          returns.stocks.push(nominalStock);
          returns.bonds.push(nominalBond);
          returns.cash.push(nominalCash);
          returns.inflation.push(result.inflationRate);
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
      // Stock mean has slight upward bias (~0.5%) from t-distribution interacting with
      // log-normal convexity (Jensen's inequality), which is expected and acceptable
      expect(meanStock).toBeCloseTo(0.1, 1);
      expect(meanBond).toBeCloseTo(0.05, 1);
      expect(meanCash).toBeCloseTo(0.03, 1);
      expect(meanInflation).toBeCloseTo(0.025, 1);

      // Verify standard deviations match expected volatilities
      expect(stockStdDev).toBeCloseTo(0.18);
      expect(bondStdDev).toBeCloseTo(0.06);
      expect(cashStdDev).toBeCloseTo(0.03);
      expect(inflationStdDev).toBeCloseTo(0.04, 1);

      // Verify correlation structure is directionally correct.
      // AR(1) inflation attenuates measured correlations with inflation when pooling
      // multi-year scenarios, so we check direction and rough magnitude rather than exact values.
      expect(stockBondCorr).toBeCloseTo(-0.1, 1);
      expect(stockInflationCorr).toBeLessThan(0.05);
      expect(stockInflationCorr).toBeGreaterThan(-0.15);
      expect(bondInflationCorr).toBeLessThan(-0.1);
      expect(cashInflationCorr).toBeGreaterThan(0.1);

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

      // Test distribution properties — with t(8) fat tails, more mass falls outside
      // the normal sigma bands. Within-2σ drops from ~95% to ~90%, within-3σ from ~99.7% to ~98%.
      const testDistributionProperties = (values: number[], mean: number, stdDev: number, _name: string) => {
        const within1Sigma = values.filter((val) => Math.abs(val - mean) <= stdDev).length / values.length;
        const within2Sigma = values.filter((val) => Math.abs(val - mean) <= 2 * stdDev).length / values.length;
        const within3Sigma = values.filter((val) => Math.abs(val - mean) <= 3 * stdDev).length / values.length;

        // t(8) widens the tails vs normal
        expect(within1Sigma).toBeGreaterThan(0.58);
        expect(within1Sigma).toBeLessThan(0.78);

        expect(within2Sigma).toBeGreaterThan(0.87);
        expect(within2Sigma).toBeLessThan(0.98);

        expect(within3Sigma).toBeGreaterThan(0.97);
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

          yields.bondYield.push(result.yields.bonds);
          yields.stockYield.push(result.yields.stocks);
          yields.inflation.push(result.inflationRate);
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

  describe('decimal format contract', () => {
    it('should return all values in decimal format', () => {
      const provider = new StochasticReturnsProvider(defaultInputs, 12345);
      const result = provider.getReturns(phaseData);

      // All fields should be decimals (less than 1 for typical rates)
      expect(Math.abs(result.inflationRate)).toBeLessThan(1);
      expect(Math.abs(result.yields.stocks)).toBeLessThan(1);
      expect(Math.abs(result.yields.bonds)).toBeLessThan(1);
      expect(Math.abs(result.yields.cash)).toBeLessThan(1);
    });
  });

  describe('fat tails (t-distribution)', () => {
    it('should produce excess kurtosis > 0 confirming fat tails', () => {
      const inputs = {
        ...defaultInputs,
        marketAssumptions: {
          stockReturn: 10,
          stockYield: 3,
          bondReturn: 5,
          bondYield: 3,
          cashReturn: 3,
          inflationRate: 2.5,
        },
      };

      const baseSeed = 42;
      const numSamples = 10000;
      const bondReturns: number[] = [];
      const cashReturns: number[] = [];

      for (let i = 0; i < numSamples; i++) {
        const provider = new StochasticReturnsProvider(inputs, baseSeed + i * 1009);
        const result = provider.getReturns(phaseData);
        const nominalBond = (1 + result.returns.bonds) * (1 + result.inflationRate) - 1;
        const nominalCash = (1 + result.returns.cash) * (1 + result.inflationRate) - 1;
        bondReturns.push(nominalBond);
        cashReturns.push(nominalCash);
      }

      const calcExcessKurtosis = (values: number[]) => {
        const n = values.length;
        const mean = values.reduce((s, v) => s + v, 0) / n;
        const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
        const fourthMoment = values.reduce((s, v) => s + (v - mean) ** 4, 0) / n;
        return fourthMoment / (variance * variance) - 3;
      };

      // For t(8), excess kurtosis should be ~1.5; normal would be ~0
      expect(calcExcessKurtosis(bondReturns)).toBeGreaterThan(0.3);
      expect(calcExcessKurtosis(cashReturns)).toBeGreaterThan(0.3);
    });
  });

  describe('inflation persistence (AR(1))', () => {
    it('should have positive lag-1 autocorrelation close to 0.65', () => {
      const inputs = {
        ...defaultInputs,
        marketAssumptions: {
          stockReturn: 10,
          stockYield: 3,
          bondReturn: 5,
          bondYield: 3,
          cashReturn: 3,
          inflationRate: 3,
        },
      };

      const provider = new StochasticReturnsProvider(inputs, 42);
      const inflationSeries: number[] = [];

      for (let year = 0; year < 2000; year++) {
        const result = provider.getReturns(phaseData);
        inflationSeries.push(result.inflationRate);
      }

      // Compute lag-1 autocorrelation
      const n = inflationSeries.length;
      const mean = inflationSeries.reduce((s, v) => s + v, 0) / n;
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n - 1; i++) {
        numerator += (inflationSeries[i] - mean) * (inflationSeries[i + 1] - mean);
      }
      for (let i = 0; i < n; i++) {
        denominator += (inflationSeries[i] - mean) ** 2;
      }
      const autocorrelation = numerator / denominator;

      // Should be close to 0.65 (the AR(1) coefficient)
      expect(autocorrelation).toBeGreaterThan(0.45);
      expect(autocorrelation).toBeLessThan(0.8);
    });

    it('should have inflation mean converging to expected value across many seeds', () => {
      const expectedInflation = 0.03;
      const inputs = {
        ...defaultInputs,
        marketAssumptions: {
          stockReturn: 10,
          stockYield: 3,
          bondReturn: 5,
          bondYield: 3,
          cashReturn: 3,
          inflationRate: expectedInflation * 100,
        },
      };

      const allInflation: number[] = [];
      for (let seed = 0; seed < 500; seed++) {
        const provider = new StochasticReturnsProvider(inputs, seed * 1009 + 1);
        for (let year = 0; year < 20; year++) {
          const result = provider.getReturns(phaseData);
          allInflation.push(result.inflationRate);
        }
      }

      const meanInflation = allInflation.reduce((s, v) => s + v, 0) / allInflation.length;
      expect(meanInflation).toBeCloseTo(expectedInflation, 2);
    });
  });

  describe('multi-year determinism', () => {
    it('should produce identical 30-year sequences for same seed', () => {
      const provider1 = new StochasticReturnsProvider(defaultInputs, 777);
      const provider2 = new StochasticReturnsProvider(defaultInputs, 777);

      for (let year = 0; year < 30; year++) {
        const r1 = provider1.getReturns(phaseData);
        const r2 = provider2.getReturns(phaseData);

        expect(r1.returns.stocks).toBe(r2.returns.stocks);
        expect(r1.returns.bonds).toBe(r2.returns.bonds);
        expect(r1.returns.cash).toBe(r2.returns.cash);
        expect(r1.inflationRate).toBe(r2.inflationRate);
        expect(r1.yields.bonds).toBe(r2.yields.bonds);
        expect(r1.yields.stocks).toBe(r2.yields.stocks);
      }
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
