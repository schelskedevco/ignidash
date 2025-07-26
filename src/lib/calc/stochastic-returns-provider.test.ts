import { describe, it, expect } from 'vitest';

import { defaultState } from '@/lib/stores/quick-plan-store';

import { StochasticReturnsProvider } from './stochastic-returns-provider';

describe('StochasticReturnsProvider', () => {
  describe('generateNormalReturn', () => {
    it('should apply normal distribution formula correctly', () => {
      const provider = new StochasticReturnsProvider(defaultState.inputs, 12345);
      const generateNormalReturn = StochasticReturnsProvider.prototype['generateNormalReturn'];

      const expectedReturn = 0.08; // 8%
      const volatility = 0.15; // 15%
      const zScore = 2; // 2 standard deviations above mean

      const result = generateNormalReturn.call(provider, expectedReturn, volatility, zScore);

      // Expected: 0.08 + 0.15 * 2 = 0.38
      expect(result).toBeCloseTo(0.38, 10);
    });

    it('should handle zero volatility correctly', () => {
      const provider = new StochasticReturnsProvider(defaultState.inputs, 12345);
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
      const provider = new StochasticReturnsProvider(defaultState.inputs, 12345);
      const generateLogNormalReturn = StochasticReturnsProvider.prototype['generateLogNormalReturn'];

      const expectedReturn = 0.1; // 10%
      const volatility = 0.22; // 22%
      const zScore = -3; // Extreme negative event

      const result = generateLogNormalReturn.call(provider, expectedReturn, volatility, zScore);

      // Calculate expected value using the log-normal formula
      const mu = Math.log(1 + expectedReturn) - 0.5 * volatility * volatility;
      const expectedValue = Math.exp(mu + volatility * zScore) - 1;

      // Verify the exact calculation
      expect(result).toBeCloseTo(expectedValue, 10);

      // Verify log-normal constraint: returns > -100%
      expect(result).toBeGreaterThan(-1);
    });

    it('should handle zero volatility by returning expected return', () => {
      const provider = new StochasticReturnsProvider(defaultState.inputs, 12345);
      const generateLogNormalReturn = StochasticReturnsProvider.prototype['generateLogNormalReturn'];

      const expectedReturn = 0.12; // 12%
      const volatility = 0; // No volatility
      const zScore = -5; // Extreme z-score should have no effect

      const result = generateLogNormalReturn.call(provider, expectedReturn, volatility, zScore);

      // With zero volatility: mu = ln(1 + E[R]), result = exp(mu) - 1 = E[R]
      expect(result).toBeCloseTo(expectedReturn, 10);
    });
  });

  describe('getReturns integration', () => {
    it('should produce deterministic results with seeded random generation', () => {
      const provider1 = new StochasticReturnsProvider(defaultState.inputs, 999);
      const provider2 = new StochasticReturnsProvider(defaultState.inputs, 999);

      const result1 = provider1.getReturns(1); // Year 1 of simulation
      const result2 = provider2.getReturns(1); // Year 1 of simulation

      expect(result1.returns.stocks).toBe(result2.returns.stocks);
      expect(result1.returns.bonds).toBe(result2.returns.bonds);
      expect(result1.returns.cash).toBe(result2.returns.cash);
      expect(result1.metadata.inflationRate).toBe(result2.metadata.inflationRate);
    });

    it('should converge to expected statistical properties across many simulations', () => {
      const inputs = {
        ...defaultState.inputs,
        marketAssumptions: {
          stockReturn: 10,
          bondReturn: 5,
          cashReturn: 3,
          inflationRate: 2.5,
        },
      };

      const provider = new StochasticReturnsProvider(inputs, 42);
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
        provider.resetForNewScenario(scenario);

        // Simulate multiple years within each scenario
        for (let year = 1; year <= yearsPerScenario; year++) {
          const result = provider.getReturns(year);

          // Convert real returns back to nominal for statistical analysis
          const nominalStock = (1 + result.returns.stocks) * (1 + result.metadata.inflationRate / 100) - 1;
          const nominalBond = (1 + result.returns.bonds) * (1 + result.metadata.inflationRate / 100) - 1;
          const nominalCash = (1 + result.returns.cash) * (1 + result.metadata.inflationRate / 100) - 1;

          returns.stocks.push(nominalStock);
          returns.bonds.push(nominalBond);
          returns.cash.push(nominalCash);
          returns.inflation.push(result.metadata.inflationRate / 100);
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
      expect(meanStock).toBeCloseTo(0.1, 2);
      expect(meanBond).toBeCloseTo(0.05, 2);
      expect(meanCash).toBeCloseTo(0.03, 2);
      expect(meanInflation).toBeCloseTo(0.025, 2);

      // Verify standard deviations match expected volatilities
      expect(stockStdDev).toBeCloseTo(0.22, 1);
      expect(bondStdDev).toBeCloseTo(0.06, 2);
      expect(cashStdDev).toBeCloseTo(0.01, 2);
      expect(inflationStdDev).toBeCloseTo(0.03, 2);

      // Verify correlation structure (from CORRELATION_MATRIX)
      // [1.0, -0.1, 0.05, -0.15], // Stocks
      // [-0.1, 1.0, 0.2, -0.3],   // Bonds
      // [0.05, 0.2, 1.0, 0.6],    // Cash
      // [-0.15, -0.3, 0.6, 1.0],  // Inflation
      expect(stockBondCorr).toBeCloseTo(-0.1, 1);
      expect(stockInflationCorr).toBeCloseTo(-0.15, 1);
      expect(bondInflationCorr).toBeCloseTo(-0.3, 1); // Strongest negative correlation
      expect(cashInflationCorr).toBeCloseTo(0.6, 1); // Strongest positive correlation

      // Verify return constraints
      const minStockReturn = Math.min(...returns.stocks);
      const minBondReturn = Math.min(...returns.bonds);
      const minCashReturn = Math.min(...returns.cash);
      const minInflationRate = Math.min(...returns.inflation);

      // Log-normal constraint for stocks (mathematically guaranteed)
      expect(minStockReturn).toBeGreaterThan(-1);

      // Normal distributions should statistically never hit -100% with our volatility parameters
      expect(minBondReturn).toBeGreaterThan(-1); // Bonds: 5% mean, 6% vol
      expect(minCashReturn).toBeGreaterThan(-1); // Cash: 3% mean, 1% vol
      expect(minInflationRate).toBeGreaterThan(-1); // Inflation: 2.5% mean, 3% vol

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
  });
});
