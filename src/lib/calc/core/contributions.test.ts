import { describe, it, expect, vi } from 'vitest';

import { defaultState } from '@/lib/stores/quick-plan-store';

import { calculateYearlyContribution, calculateRetirementCashFlow } from './contributions';

describe('calculateYearlyContribution', () => {
  it('should calculate correct contribution for year 0 (base year)', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 100000,
        annualExpenses: 60000,
      },
      growthRates: {
        incomeGrowthRate: 3,
        expenseGrowthRate: 3,
      },
    };

    const result = calculateYearlyContribution(inputs, 0);

    // Year 0: 100,000 - 60,000 = 40,000
    expect(result).toBe(40000);
  });

  it('should calculate correct contribution for year 1 with growth equal to inflation', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 100000,
        annualExpenses: 60000,
      },
      growthRates: {
        incomeGrowthRate: 3,
        expenseGrowthRate: 3,
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        inflationRate: 3,
      },
    };

    const result = calculateYearlyContribution(inputs, 1);

    // With 3% nominal growth and 3% inflation, real growth is 0%
    // Year 1: (100,000 × 1.0) - (60,000 × 1.0) = 100,000 - 60,000 = 40,000
    expect(result).toBe(40000);
  });

  it('should calculate correct contribution for year 1 with positive real growth', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 100000,
        annualExpenses: 60000,
      },
      growthRates: {
        incomeGrowthRate: 5, // 5% nominal
        expenseGrowthRate: 5, // 5% nominal
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        inflationRate: 3,
      },
    };

    const result = calculateYearlyContribution(inputs, 1);

    // Real growth = (1.05 / 1.03) - 1 = 0.0194 = 1.94%
    // Year 1: (100,000 × 1.0194) - (60,000 × 1.0194) = 101,940 - 61,164 = 40,776
    expect(result).toBeCloseTo(40776.7, 1);
  });

  it('should handle different growth rates for income and expenses', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 100000,
        annualExpenses: 60000,
      },
      growthRates: {
        incomeGrowthRate: 5, // Higher income growth (nominal)
        expenseGrowthRate: 2, // Lower expense growth (nominal)
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        inflationRate: 3,
      },
    };

    const result = calculateYearlyContribution(inputs, 1);

    // Real income growth: (1.05 / 1.03) - 1 = 0.0194 = 1.94%
    // Real expense growth: (1.02 / 1.03) - 1 = -0.0097 = -0.97%
    // Year 1: (100,000 × 1.0194) - (60,000 × 0.9903) = 101,941.75 - 59,417.48 = 42,524.27
    expect(result).toBeCloseTo(42524.27, 2);
  });

  it('should handle multiple years with compounding when growth equals inflation', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 100000,
        annualExpenses: 60000,
      },
      growthRates: {
        incomeGrowthRate: 3,
        expenseGrowthRate: 3,
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        inflationRate: 3,
      },
    };

    const result = calculateYearlyContribution(inputs, 5);

    // With 3% nominal growth and 3% inflation, real growth is 0%
    // Year 5: (100,000 × 1.0^5) - (60,000 × 1.0^5) = 100,000 - 60,000 = 40,000
    expect(result).toBe(40000);
  });

  it('should return null when annualIncome is null', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: null,
        annualExpenses: 60000,
      },
    };

    const result = calculateYearlyContribution(inputs, 1);

    expect(consoleSpy).toHaveBeenCalledWith('Cannot calculate yearly contribution: annual income and expenses are required');
    expect(result).toBe(null);
    consoleSpy.mockRestore();
  });

  it('should return null when annualExpenses is null', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 100000,
        annualExpenses: null,
      },
    };

    const result = calculateYearlyContribution(inputs, 1);

    expect(consoleSpy).toHaveBeenCalledWith('Cannot calculate yearly contribution: annual income and expenses are required');
    expect(result).toBe(null);
    consoleSpy.mockRestore();
  });

  it('should handle negative contribution (expenses exceed income)', () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 50000,
        annualExpenses: 60000, // Spending more than earning
      },
      growthRates: {
        incomeGrowthRate: 2,
        expenseGrowthRate: 4, // Expenses growing faster (nominal)
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        inflationRate: 3,
      },
    };

    const result0 = calculateYearlyContribution(inputs, 0);
    const result1 = calculateYearlyContribution(inputs, 1);

    // Year 0: 50,000 - 60,000 = -10,000
    expect(result0).toBe(-10000);

    // Real income growth: (1.02 / 1.03) - 1 = -0.97%
    // Real expense growth: (1.04 / 1.03) - 1 = 0.97%
    // Year 1: (50,000 × 0.9903) - (60,000 × 1.0097) = 49,514.56 - 60,582.52 = -11,067.96
    expect(result1).toBeCloseTo(-11067.96, 2);
  });
});

describe('calculateRetirementCashFlow', () => {
  const baseScenario = {
    retirementExpenses: 80000,
    retirementIncome: 30000,
    effectiveTaxRate: 25,
  };

  describe('Retirement Income Age Boundary Tests', () => {
    it('should not apply retirement income at age 61 (below threshold)', () => {
      const result = calculateRetirementCashFlow(
        baseScenario.retirementExpenses,
        baseScenario.retirementIncome,
        baseScenario.effectiveTaxRate,
        61
      );

      // At age 61, no retirement income applied
      // Net passive income: $0
      // Shortfall: $80,000 - $0 = $80,000
      // Gross withdrawal: $80,000 / 0.75 = $106,667
      expect(result.grossWithdrawal).toBeCloseTo(106666.67, 2);
      expect(result.surplus).toBe(0);
    });

    it('should apply retirement income exactly at age 62 (threshold)', () => {
      const result = calculateRetirementCashFlow(
        baseScenario.retirementExpenses,
        baseScenario.retirementIncome,
        baseScenario.effectiveTaxRate,
        62
      );

      // At age 62, retirement income applies
      // Net passive income: $30,000 × 0.75 = $22,500
      // Shortfall: $80,000 - $22,500 = $57,500
      // Gross withdrawal: $57,500 / 0.75 = $76,667
      expect(result.grossWithdrawal).toBeCloseTo(76666.67, 2);
      expect(result.surplus).toBe(0);
    });

    it('should apply retirement income at age 63 (above threshold)', () => {
      const result = calculateRetirementCashFlow(
        baseScenario.retirementExpenses,
        baseScenario.retirementIncome,
        baseScenario.effectiveTaxRate,
        63
      );

      // At age 63, retirement income applies (same as age 62)
      // Net passive income: $30,000 × 0.75 = $22,500
      // Shortfall: $80,000 - $22,500 = $57,500
      // Gross withdrawal: $57,500 / 0.75 = $76,667
      expect(result.grossWithdrawal).toBeCloseTo(76666.67, 2);
      expect(result.surplus).toBe(0);
    });

    it('should handle large age values consistently', () => {
      const result = calculateRetirementCashFlow(
        baseScenario.retirementExpenses,
        baseScenario.retirementIncome,
        baseScenario.effectiveTaxRate,
        85
      );

      // At age 85, retirement income still applies
      expect(result.grossWithdrawal).toBeCloseTo(76666.67, 2);
      expect(result.surplus).toBe(0);
    });
  });

  describe('Extreme Tax Rate Scenarios', () => {
    it('should handle 0% tax rate correctly', () => {
      const result = calculateRetirementCashFlow(
        50000,
        20000,
        0, // 0% tax rate
        65
      );

      // With 0% tax rate:
      // Net passive income: $20,000 × 1.0 = $20,000
      // Shortfall: $50,000 - $20,000 = $30,000
      // Gross withdrawal: $30,000 / 1.0 = $30,000
      expect(result.grossWithdrawal).toBe(30000);
      expect(result.surplus).toBe(0);
    });

    it('should handle very high tax rate (48%)', () => {
      const result = calculateRetirementCashFlow(
        60000,
        40000,
        48, // 48% tax rate
        65
      );

      // With 48% tax rate:
      // Net passive income: $40,000 × 0.52 = $20,800
      // Shortfall: $60,000 - $20,800 = $39,200
      // Gross withdrawal: $39,200 / 0.52 = $75,384.62
      expect(result.grossWithdrawal).toBeCloseTo(75384.62, 2);
      expect(result.surplus).toBe(0);
    });

    it('should handle maximum tax rate (50%)', () => {
      const result = calculateRetirementCashFlow(
        80000,
        60000,
        50, // 50% tax rate
        65
      );

      // With 50% tax rate:
      // Net passive income: $60,000 × 0.5 = $30,000
      // Shortfall: $80,000 - $30,000 = $50,000
      // Gross withdrawal: $50,000 / 0.5 = $100,000
      expect(result.grossWithdrawal).toBe(100000);
      expect(result.surplus).toBe(0);
    });
  });

  describe('Surplus Scenarios', () => {
    it('should calculate surplus when retirement income exceeds expenses', () => {
      const result = calculateRetirementCashFlow(
        50000, // Low expenses
        80000, // High retirement income
        25,
        65
      );

      // Net passive income: $80,000 × 0.75 = $60,000
      // Surplus: $60,000 - $50,000 = $10,000
      expect(result.grossWithdrawal).toBe(0);
      expect(result.surplus).toBe(10000);
    });

    it('should handle surplus with high tax rates', () => {
      const result = calculateRetirementCashFlow(
        40000,
        100000, // Very high retirement income
        45, // High tax rate
        65
      );

      // Net passive income: $100,000 × 0.55 = $55,000
      // Surplus: $55,000 - $40,000 = $15,000
      expect(result.grossWithdrawal).toBe(0);
      expect(result.surplus).toBeCloseTo(15000, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle exact balance between income and expenses', () => {
      const result = calculateRetirementCashFlow(
        60000,
        80000, // Net income after tax exactly equals expenses
        25, // 80000 * 0.75 = 60000
        65
      );

      // Net passive income: $80,000 × 0.75 = $60,000
      // Exactly matches expenses
      expect(result.grossWithdrawal).toBe(0);
      expect(result.surplus).toBe(0);
    });

    it('should handle zero retirement income', () => {
      const result = calculateRetirementCashFlow(
        50000,
        0, // No retirement income
        25,
        65
      );

      // Net passive income: $0
      // Shortfall: $50,000
      // Gross withdrawal: $50,000 / 0.75 = $66,667
      expect(result.grossWithdrawal).toBeCloseTo(66666.67, 2);
      expect(result.surplus).toBe(0);
    });

    it('should handle zero expenses', () => {
      const result = calculateRetirementCashFlow(
        0, // Zero expenses
        30000,
        25,
        65
      );

      // Net passive income: $30,000 × 0.75 = $22,500
      // All income becomes surplus
      expect(result.grossWithdrawal).toBe(0);
      expect(result.surplus).toBe(22500);
    });
  });
});
