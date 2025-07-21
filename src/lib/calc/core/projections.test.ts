import { describe, it, expect, vi } from 'vitest';

import { defaultState } from '@/lib/stores/quick-plan-store';

import { calculateRequiredPortfolio, calculateFuturePortfolioValue, calculateFuturePortfolioValueAfterRetirement } from './projections';

describe('calculateRequiredPortfolio', () => {
  it('should return 1,000,000 for 40,000 retirement expenses with 4% SWR', () => {
    const result = calculateRequiredPortfolio(40000, 4);
    expect(result).toBe(1000000);
  });

  it('should warn and return -1 when retirementExpenses is null', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = calculateRequiredPortfolio(null, 4);

    expect(consoleSpy).toHaveBeenCalledWith('Cannot calculate required portfolio: retirement expenses is required');
    expect(result).toBe(null);
    consoleSpy.mockRestore();
  });
});

describe('calculateFuturePortfolioValue', () => {
  it('should calculate correct future value with positive real returns and contributions', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: 100000,
        annualIncome: 80000,
        annualExpenses: 50000,
      },
      allocation: {
        stockAllocation: 70,
        bondAllocation: 30,
        cashAllocation: 0,
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        stockReturn: 10,
        bondReturn: 5,
        cashReturn: 3,
        inflationRate: 3,
      },
      growthRates: {
        incomeGrowthRate: 3, // Nominal growth
        expenseGrowthRate: 3, // Nominal growth
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 5);

    // Since growth rates are nominal (3%) and inflation is 3%, real growth is 0%
    // Real return: 5.3398% (from nominal 8.5% and 3% inflation)
    // Initial assets after 5 years: 100,000 × (1.053398)^5 = 129,706.75
    //
    // Contributions stay constant at 30,000 in real terms (0% real growth):
    // Year 0: 30,000 × (1.053398)^4 = 36,939.53
    // Year 1: 30,000 × (1.053398)^3 = 35,067.01
    // Year 2: 30,000 × (1.053398)^2 = 33,289.42
    // Year 3: 30,000 × (1.053398)^1 = 31,601.94
    // Year 4: 30,000 × (1.053398)^0 = 30,000.00
    // Total contributions FV: 166,897.91
    //
    // Total: 129,706.75 + 166,897.91 = 296,604.65

    expect(result).toBeCloseTo(296604.65, 0);
  });

  it('should calculate correct future value when growth equals inflation (0% real growth)', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: 100000,
        annualIncome: 80000,
        annualExpenses: 50000,
      },
      allocation: {
        stockAllocation: 70,
        bondAllocation: 30,
        cashAllocation: 0,
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        stockReturn: 10,
        bondReturn: 5,
        cashReturn: 3,
        inflationRate: 3,
      },
      growthRates: {
        incomeGrowthRate: 3, // Same as inflation = 0% real growth
        expenseGrowthRate: 3, // Same as inflation = 0% real growth
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 5);

    // Real return: 5.3398% (from nominal 8.5% and 3% inflation)
    // Initial assets after 5 years: 100,000 × (1.053398)^5 = 129,706.75
    //
    // Contributions stay constant at 30,000 in real terms (0% real growth):
    // Year 0: 30,000 × (1.053398)^4 = 36,939.53
    // Year 1: 30,000 × (1.053398)^3 = 35,067.01
    // Year 2: 30,000 × (1.053398)^2 = 33,289.42
    // Year 3: 30,000 × (1.053398)^1 = 31,601.94
    // Year 4: 30,000 × (1.053398)^0 = 30,000.00
    // Total contributions FV: 166,897.91
    //
    // Total: 129,706.75 + 166,897.91 = 296,604.65

    expect(result).toBeCloseTo(296604.65, 0);
  });

  it('should handle zero real return scenario (100% cash with inflation = cash return)', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: 100000,
        annualIncome: 80000,
        annualExpenses: 50000,
      },
      allocation: {
        stockAllocation: 0,
        bondAllocation: 0,
        cashAllocation: 100,
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        stockReturn: 10,
        bondReturn: 5,
        cashReturn: 3,
        inflationRate: 3, // Same as cash return = 0% real return
      },
      growthRates: {
        incomeGrowthRate: 3, // With 3% inflation, this is 0% real growth
        expenseGrowthRate: 3, // With 3% inflation, this is 0% real growth
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 5);

    // With 0% real return and 0% real growth on contributions
    // Initial assets: 100,000 (no real growth)
    // Contributions: 30,000 per year × 5 years = 150,000
    // Total: 100,000 + 150,000 = 250,000

    expect(result).toBe(250000);
  });

  it('should handle negative contributions in later years when expenses grow faster than income', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: 500000,
        annualIncome: 60000,
        annualExpenses: 55000, // Close to income
      },
      allocation: {
        stockAllocation: 60,
        bondAllocation: 40,
        cashAllocation: 0,
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        stockReturn: 10,
        bondReturn: 5,
        cashReturn: 3,
        inflationRate: 3,
      },
      growthRates: {
        incomeGrowthRate: 1, // Income grows slowly (nominal)
        expenseGrowthRate: 4, // Expenses grow faster (nominal)
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 10);

    // Real return: (1.07 / 1.03) - 1 = 3.883%
    // Real income growth: (1.01 / 1.03) - 1 = -1.94%
    // Real expense growth: (1.04 / 1.03) - 1 = 0.97%
    //
    // Contributions turn negative as expenses grow faster than income in real terms
    // Assets should grow but be reduced by negative contributions (withdrawals)

    expect(result).toBeGreaterThan(500000); // Should still grow due to returns
    expect(result).toBeLessThan(800000); // But limited by withdrawals
  });

  it('should return -1 when investedAssets is null', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: null,
        annualIncome: 80000,
        annualExpenses: 50000,
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 5);

    expect(consoleSpy).toHaveBeenCalledWith('Cannot calculate future portfolio value: invested assets is required');
    expect(result).toBe(null);
    consoleSpy.mockRestore();
  });

  it('should return -1 when calculateYearlyContribution returns -1', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: 100000,
        annualIncome: null, // This will cause calculateYearlyContribution to return -1
        annualExpenses: 50000,
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 5);

    expect(consoleSpy).toHaveBeenCalledWith('Cannot calculate yearly contribution: annual income and expenses are required');
    expect(result).toBe(null);
    consoleSpy.mockRestore();
  });

  // New tests for floating point year handling
  describe('Floating Point Year Handling', () => {
    const baseInputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: 100000,
        annualIncome: 80000,
        annualExpenses: 50000,
      },
      allocation: {
        stockAllocation: 70,
        bondAllocation: 30,
        cashAllocation: 0,
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        stockReturn: 10,
        bondReturn: 5,
        cashReturn: 3,
        inflationRate: 3,
      },
      growthRates: {
        incomeGrowthRate: 3,
        expenseGrowthRate: 3,
      },
    };

    it('should handle small fractional years correctly', () => {
      const result01 = calculateFuturePortfolioValue(baseInputs, 0.1);
      const result05 = calculateFuturePortfolioValue(baseInputs, 0.5);
      const result09 = calculateFuturePortfolioValue(baseInputs, 0.9);

      // Should have smooth progression
      expect(result01).toBeGreaterThan(100000); // More than starting assets
      expect(result05).toBeGreaterThan(result01!);
      expect(result09).toBeGreaterThan(result05!);

      // 0.5 years should include half a year's contribution (15,000) plus asset growth
      const expectedAssetGrowth = 100000 * Math.pow(1.053398, 0.5); // ~102,618
      const expectedPartialContribution = 30000 * 0.5; // 15,000
      expect(result05).toBeCloseTo(expectedAssetGrowth + expectedPartialContribution, 0);
    });

    it('should handle fractional years near boundaries correctly', () => {
      const result099 = calculateFuturePortfolioValue(baseInputs, 0.99);
      const result100 = calculateFuturePortfolioValue(baseInputs, 1.0);
      const result101 = calculateFuturePortfolioValue(baseInputs, 1.01);

      // Should show smooth progression across the 1-year boundary
      expect(result100).toBeGreaterThan(result099!);
      expect(result101).toBeGreaterThan(result100!);

      // Difference between 0.99 and 1.01 should be small
      const diff = result101! - result099!;
      expect(diff).toBeLessThan(1000); // Should be small difference
    });

    it('should correctly prorate partial year contributions', () => {
      const result25 = calculateFuturePortfolioValue(baseInputs, 2.25);
      const result20 = calculateFuturePortfolioValue(baseInputs, 2.0);

      // The difference includes:
      // 1. Additional asset growth for 0.25 years
      // 2. Prorated contribution (0.25 * 30,000 = 7,500) with no growth
      const rateOfReturn = 0.053398; // Real return rate
      const assetGrowthDifference = result20! * (Math.pow(1 + rateOfReturn, 0.25) - 1);
      const proratedContribution = 30000 * 0.25;
      const expectedDifference = assetGrowthDifference + proratedContribution;

      const actualDifference = result25! - result20!;
      expect(actualDifference).toBeCloseTo(expectedDifference, 0);
    });

    it('should verify mathematical continuity for various fractional years', () => {
      const years = [1.1, 1.3, 1.7, 1.9];
      const results = years.map((y) => calculateFuturePortfolioValue(baseInputs, y));

      // Results should be in ascending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThan(results[i - 1]!);
      }
    });

    it('should handle very small fractional years', () => {
      const result001 = calculateFuturePortfolioValue(baseInputs, 0.001);
      const result000 = calculateFuturePortfolioValue(baseInputs, 0);

      // Should be barely more than starting assets
      expect(result001).toBeGreaterThan(result000!);
      expect(result001! - result000!).toBeLessThan(100); // Very small difference
    });

    it('should handle high precision fractional years', () => {
      const result = calculateFuturePortfolioValue(baseInputs, 1.123456789);

      // Should handle high precision without issues
      expect(result).toBeGreaterThan(100000);
      expect(result).not.toBeNull();
    });
  });
});

describe('calculateFuturePortfolioValueAfterRetirement', () => {
  const baseInputs = {
    ...defaultState.inputs,
    goals: {
      retirementExpenses: 80000,
    },
    retirementFunding: {
      ...defaultState.inputs.retirementFunding,
      retirementIncome: 30000,
      effectiveTaxRate: 25,
    },
    allocation: {
      stockAllocation: 60,
      bondAllocation: 40,
      cashAllocation: 0,
    },
    marketAssumptions: {
      ...defaultState.inputs.marketAssumptions,
      stockReturn: 8,
      bondReturn: 4,
      cashReturn: 2,
      inflationRate: 3,
    },
  };

  it('should calculate portfolio value after retirement with withdrawals and taxes', () => {
    // Starting portfolio: $1,000,000
    // Retirement expenses: $80,000 (before taxes)
    // Passive income: $30,000 → Net: $22,500 (after 25% tax)
    // Shortfall: $57,500
    // Gross withdrawal needed: $57,500 / 0.75 = $76,667
    // Nominal return: (0.6 × 8%) + (0.4 × 4%) = 6.4%
    // Real return: (1.064 / 1.03) - 1 = 3.3009%

    const result = calculateFuturePortfolioValueAfterRetirement(baseInputs, 1000000, 1);

    // After 1 year:
    // Start: $1,000,000
    // BOY withdrawal: $76,667
    // Remaining: $923,333
    // Growth: $923,333 × 1.033009 = $953,812

    expect(result).toBeCloseTo(953812, 0);
  });

  it('should handle case where passive income covers all expenses', () => {
    const highIncomeInputs = {
      ...baseInputs,
      retirementFunding: {
        ...baseInputs.retirementFunding,
        retirementIncome: 120000, // High passive income
      },
    };

    // Passive income: $120,000 → Net: $90,000 (after 25% tax)
    // Retirement expenses: $80,000
    // No withdrawal needed, portfolio just grows

    const result = calculateFuturePortfolioValueAfterRetirement(highIncomeInputs, 1000000, 1);

    // Portfolio grows by real return: $1,000,000 × 1.033009 = $1,033,009
    expect(result).toBeCloseTo(1033010, 0);
  });

  it('should return 0 when portfolio is depleted', () => {
    const smallPortfolioInputs = {
      ...baseInputs,
      goals: {
        retirementExpenses: 200000, // Very high expenses
      },
    };

    // With only $50,000 starting portfolio and high expenses,
    // the portfolio should be depleted quickly
    const result = calculateFuturePortfolioValueAfterRetirement(smallPortfolioInputs, 50000, 1);

    expect(result).toBe(0);
  });

  it('should calculate multiple years correctly', () => {
    const result = calculateFuturePortfolioValueAfterRetirement(baseInputs, 1000000, 3);

    // Year 1: $1,000,000 - $76,667 = $923,333 → $923,333 × 1.033009 = $953,812
    // Year 2: $953,812 - $76,667 = $877,145 → $877,145 × 1.033009 = $906,090
    // Year 3: $906,090 - $76,667 = $829,423 → $829,423 × 1.033009 = $856,813

    expect(result).toBeCloseTo(856813, 0);
  });

  it('should return null when retirement expenses is null', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const invalidInputs = {
      ...baseInputs,
      goals: {
        retirementExpenses: null,
      },
    };

    const result = calculateFuturePortfolioValueAfterRetirement(invalidInputs, 1000000, 1);

    expect(consoleSpy).toHaveBeenCalledWith('Cannot calculate post-FIRE portfolio value: retirement expenses is required');
    expect(result).toBe(null);
    consoleSpy.mockRestore();
  });

  it('should handle zero tax rate correctly', () => {
    const noTaxInputs = {
      ...baseInputs,
      retirementFunding: {
        ...baseInputs.retirementFunding,
        effectiveTaxRate: 0,
      },
    };

    // No taxes:
    // Net passive income: $30,000
    // Shortfall: $50,000
    // No tax on withdrawal: $50,000 needed

    const result = calculateFuturePortfolioValueAfterRetirement(noTaxInputs, 1000000, 1);

    // After 1 year:
    // Start: $1,000,000
    // BOY withdrawal: $50,000
    // Remaining: $950,000
    // Growth: $950,000 × 1.033009 = $981,359

    expect(result).toBeCloseTo(981359, 0);
  });
});
