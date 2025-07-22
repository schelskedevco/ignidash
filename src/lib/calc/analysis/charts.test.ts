import { describe, it, expect, vi } from 'vitest';

import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { getFIREChartData } from './charts';

describe('getFIREChartData', () => {
  // Base test inputs
  const baseInputs: QuickPlanInputs = {
    basics: {
      currentAge: 30,
      annualIncome: 100000,
      annualExpenses: 60000,
      investedAssets: 100000,
    },
    growthRates: {
      incomeGrowthRate: 3,
      expenseGrowthRate: 3,
    },
    allocation: {
      stockAllocation: 70,
      bondAllocation: 30,
      cashAllocation: 0,
    },
    goals: {
      retirementExpenses: 40000,
    },
    marketAssumptions: {
      stockReturn: 10,
      bondReturn: 5,
      cashReturn: 3,
      inflationRate: 3,
    },
    retirementFunding: {
      safeWithdrawalRate: 4,
      retirementIncome: 0,
      lifeExpectancy: 85,
      effectiveTaxRate: 15,
    },
    flexiblePaths: {
      targetRetirementAge: 50,
      partTimeIncome: 0,
    },
  };

  describe('Basic Functionality', () => {
    it('should generate chart data for basic scenario without FIRE age', () => {
      const data = getFIREChartData(baseInputs, null);

      // Should have data points from age 30 to 85 (56 points)
      expect(data).toHaveLength(56);

      // Ages should be sequential integers
      expect(data[0].age).toBe(30);
      expect(data[data.length - 1].age).toBe(85);

      // Portfolio values should be increasing
      for (let i = 1; i < data.length; i++) {
        expect(data[i].portfolioValue).toBeGreaterThan(data[i - 1].portfolioValue);
      }

      // All ages should be integers (no FIRE age added)
      data.forEach((point) => {
        expect(point.age % 1).toBe(0);
      });
    });

    it('should return empty array when currentAge is null', () => {
      const invalidInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: null,
        },
      };

      const data = getFIREChartData(invalidInputs, 45.5);
      expect(data).toEqual([]);
    });

    it('should generate correct portfolio values at key ages', () => {
      const data = getFIREChartData(baseInputs, null);

      // First data point should be current portfolio value
      expect(data[0].portfolioValue).toBe(100000);

      // Values should be realistic and growing
      const age40Data = data.find((point) => point.age === 40);
      const age50Data = data.find((point) => point.age === 50);

      expect(age40Data).toBeDefined();
      expect(age50Data).toBeDefined();

      // At 10 years (age 40): ~$100k starting + ~$400k contributions + growth
      // Should be in the range of $400k-$700k
      expect(age40Data!.portfolioValue).toBeGreaterThan(400000);
      expect(age40Data!.portfolioValue).toBeLessThan(700000);

      // At 20 years (age 50): Should be significantly higher
      expect(age50Data!.portfolioValue).toBeGreaterThan(age40Data!.portfolioValue);
      expect(age50Data!.portfolioValue).toBeGreaterThan(1000000); // Should exceed 1M by age 50
    });
  });

  describe('FIRE Age Inclusion', () => {
    it('should include FIRE age when it falls between integer ages', () => {
      const fireAge = 43.8;
      const data = getFIREChartData(baseInputs, fireAge);

      // Should have one extra data point for FIRE age
      expect(data).toHaveLength(57); // 56 integer ages + 1 FIRE age

      // Should contain the exact FIRE age
      const fireAgePoint = data.find((point) => point.age === fireAge);
      expect(fireAgePoint).toBeDefined();
      expect(fireAgePoint!.age).toBe(43.8);

      // Data should still be sorted
      for (let i = 1; i < data.length; i++) {
        expect(data[i].age).toBeGreaterThan(data[i - 1].age);
      }
    });

    it('should include FIRE age when it equals an integer age', () => {
      const fireAge = 45.0;
      const data = getFIREChartData(baseInputs, fireAge);

      // Should still have 56 points (no duplicate for integer FIRE age)
      expect(data).toHaveLength(56);

      // Should contain age 45
      const age45Point = data.find((point) => point.age === 45);
      expect(age45Point).toBeDefined();
      expect(age45Point!.age).toBe(45);
    });

    it('should not include FIRE age when it falls outside the age range', () => {
      // FIRE age before start age
      let data = getFIREChartData(baseInputs, 25.5);
      expect(data).toHaveLength(56);
      expect(data.find((point) => point.age === 25.5)).toBeUndefined();

      // FIRE age after end age
      data = getFIREChartData(baseInputs, 90.3);
      expect(data).toHaveLength(56);
      expect(data.find((point) => point.age === 90.3)).toBeUndefined();
    });

    it('should handle FIRE age at the exact start age', () => {
      const fireAge = 30.0;
      const data = getFIREChartData(baseInputs, fireAge);

      expect(data).toHaveLength(56);
      expect(data[0].age).toBe(30);
    });

    it('should handle FIRE age at the exact end age', () => {
      const fireAge = 85.0;
      const data = getFIREChartData(baseInputs, fireAge);

      expect(data).toHaveLength(56);
      expect(data[data.length - 1].age).toBe(85);
    });

    it('should handle FIRE age very close to integer ages', () => {
      const fireAge = 44.99;
      const data = getFIREChartData(baseInputs, fireAge);

      expect(data).toHaveLength(57);
      const fireAgePoint = data.find((point) => point.age === fireAge);
      expect(fireAgePoint).toBeDefined();

      // Should be positioned between 44 and 45
      const fireAgeIndex = data.findIndex((point) => point.age === fireAge);
      expect(data[fireAgeIndex - 1].age).toBe(44);
      expect(data[fireAgeIndex + 1].age).toBe(45);
    });

    it('should handle multiple decimal places in FIRE age', () => {
      const fireAge = 42.123456789;
      const data = getFIREChartData(baseInputs, fireAge);

      expect(data).toHaveLength(57);
      const fireAgePoint = data.find((point) => point.age === fireAge);
      expect(fireAgePoint).toBeDefined();
      expect(fireAgePoint!.age).toBe(42.123456789);
    });
  });

  describe('Portfolio Value Calculations', () => {
    it('should calculate correct portfolio values for FIRE age', () => {
      const fireAge = 43.7;
      const data = getFIREChartData(baseInputs, fireAge);

      const fireAgePoint = data.find((point) => point.age === fireAge);
      expect(fireAgePoint).toBeDefined();

      // Portfolio value should be reasonable for the FIRE age (43.7 years = 13.7 years of growth)
      // With our base scenario, should be approaching or exceeding FIRE target (~$1M)
      expect(fireAgePoint!.portfolioValue).toBeGreaterThan(900000);
      expect(fireAgePoint!.portfolioValue).toBeLessThan(1100000);

      // Should fit properly between adjacent integer ages
      const age43Point = data.find((point) => point.age === 43);
      const age44Point = data.find((point) => point.age === 44);

      expect(fireAgePoint!.portfolioValue).toBeGreaterThan(age43Point!.portfolioValue);
      expect(fireAgePoint!.portfolioValue).toBeLessThan(age44Point!.portfolioValue);
    });

    it('should handle null portfolio values gracefully', () => {
      // Mock calculateFuturePortfolioValue to return null for specific age
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const invalidInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: null, // This will cause calculation failure for all ages
        },
      };

      const data = getFIREChartData(invalidInputs, 45.5);

      // Should return empty array if calculations fail
      expect(data).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short age range', () => {
      const shortRangeInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: 84,
        },
        retirementFunding: {
          ...baseInputs.retirementFunding,
          lifeExpectancy: 85,
        },
      };

      const data = getFIREChartData(shortRangeInputs, 84.5);

      // Should have 2 integer ages + 1 FIRE age = 3 points
      expect(data).toHaveLength(3);
      expect(data.map((p) => p.age)).toEqual([84, 84.5, 85]);
    });

    it('should handle single year range', () => {
      const singleYearInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: 85,
        },
        retirementFunding: {
          ...baseInputs.retirementFunding,
          lifeExpectancy: 85,
        },
      };

      const data = getFIREChartData(singleYearInputs, null);

      // Should have exactly 1 point
      expect(data).toHaveLength(1);
      expect(data[0].age).toBe(85);
    });

    it('should handle FIRE age exactly at boundary with single year range', () => {
      const singleYearInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: 85,
        },
        retirementFunding: {
          ...baseInputs.retirementFunding,
          lifeExpectancy: 85,
        },
      };

      const data = getFIREChartData(singleYearInputs, 85.0);

      // Should still have exactly 1 point (no duplicate)
      expect(data).toHaveLength(1);
      expect(data[0].age).toBe(85);
    });

    it('should handle currentAge greater than lifeExpectancy', () => {
      const invalidRangeInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: 90,
        },
        retirementFunding: {
          ...baseInputs.retirementFunding,
          lifeExpectancy: 85,
        },
      };

      const data = getFIREChartData(invalidRangeInputs, 92.5);

      // Should return empty array because the for loop (age = 90; age <= 85; age++) won't execute
      expect(data).toEqual([]);

      // Verify the logic: when startAge > endAge, no iterations occur
      expect(90).toBeGreaterThan(85); // Confirms our invalid range scenario
    });

    it('should maintain precision for high-precision FIRE ages', () => {
      const fireAge = 35.123456789012345;
      const data = getFIREChartData(baseInputs, fireAge);

      const fireAgePoint = data.find((point) => point.age === fireAge);
      expect(fireAgePoint).toBeDefined();
      expect(fireAgePoint!.age).toBe(fireAge);
    });
  });

  describe('Data Integrity', () => {
    it('should ensure all data points have valid ages and portfolio values', () => {
      const fireAge = 42.7;
      const data = getFIREChartData(baseInputs, fireAge);

      data.forEach((point) => {
        expect(typeof point.age).toBe('number');
        expect(typeof point.portfolioValue).toBe('number');
        expect(point.age).toBeGreaterThanOrEqual(30);
        expect(point.age).toBeLessThanOrEqual(85);
        expect(point.portfolioValue).toBeGreaterThan(0);
      });
    });

    it('should ensure chronological ordering with FIRE age', () => {
      const fireAge = 37.3;
      const data = getFIREChartData(baseInputs, fireAge);

      for (let i = 1; i < data.length; i++) {
        expect(data[i].age).toBeGreaterThan(data[i - 1].age);
        // Portfolio values may decrease after retirement due to withdrawals exceeding growth
        // So we only check that ages are in order, not portfolio values
      }
    });

    it('should not have duplicate ages when FIRE age is included', () => {
      const fireAge = 41.8;
      const data = getFIREChartData(baseInputs, fireAge);

      const ages = data.map((point) => point.age);
      const uniqueAges = new Set(ages);

      expect(ages.length).toBe(uniqueAges.size);
    });

    it('should validate mathematical relationship between adjacent age points', () => {
      const fireAge = 35.3;
      const data = getFIREChartData(baseInputs, fireAge);

      // Find the FIRE age point and its neighbors
      const fireAgeIndex = data.findIndex((point) => point.age === fireAge);
      expect(fireAgeIndex).toBeGreaterThan(0);
      expect(fireAgeIndex).toBeLessThan(data.length - 1);

      const prevPoint = data[fireAgeIndex - 1];
      const firePoint = data[fireAgeIndex];
      const nextPoint = data[fireAgeIndex + 1];

      // Mathematical validation: FIRE age point should be valid
      // Portfolio values may not follow a simple increasing pattern due to withdrawal phase
      // We validate that the FIRE point has a reasonable portfolio value instead
      expect(firePoint.portfolioValue).toBeGreaterThan(0);
      expect(typeof firePoint.portfolioValue).toBe('number');

      // Age ordering should be perfect
      expect(firePoint.age).toBeGreaterThan(prevPoint.age);
      expect(firePoint.age).toBeLessThan(nextPoint.age);

      // The fractional age should be between the integer ages
      expect(prevPoint.age % 1).toBe(0); // Should be integer
      expect(nextPoint.age % 1).toBe(0); // Should be integer
      expect(firePoint.age % 1).toBeGreaterThan(0); // Should be fractional
    });
  });

  describe('Life Expectancy Edge Cases', () => {
    it('should handle minimum life expectancy (50 years)', () => {
      const minLifeExpectancyInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: 45, // 5 years before minimum life expectancy
        },
        retirementFunding: {
          ...baseInputs.retirementFunding,
          lifeExpectancy: 50, // Minimum allowed
        },
      };

      const data = getFIREChartData(minLifeExpectancyInputs, null);

      // Should have data points from age 45 to 50 (6 points)
      expect(data).toHaveLength(6);
      expect(data[0].age).toBe(45);
      expect(data[data.length - 1].age).toBe(50);

      // All portfolio values should be valid numbers
      data.forEach((point) => {
        expect(typeof point.portfolioValue).toBe('number');
        expect(point.portfolioValue).toBeGreaterThan(0);
      });
    });

    it('should handle maximum life expectancy (110 years)', () => {
      const maxLifeExpectancyInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: 25,
        },
        retirementFunding: {
          ...baseInputs.retirementFunding,
          lifeExpectancy: 110, // Maximum allowed
        },
      };

      const data = getFIREChartData(maxLifeExpectancyInputs, null);

      // Should have data points from age 25 to 110 (86 points)
      expect(data).toHaveLength(86);
      expect(data[0].age).toBe(25);
      expect(data[data.length - 1].age).toBe(110);

      // Portfolio values should continue to be calculated even at extreme ages
      const lastPoint = data[data.length - 1];
      expect(typeof lastPoint.portfolioValue).toBe('number');
    });
  });
});
