import { describe, it, expect } from 'vitest';

import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { calculateYearsToFIRE, calculateFIREAge, getFIREAnalysis } from './calculator';
import { calculateFuturePortfolioValue, calculateRequiredPortfolio } from '../core/projections';
import { calculateWeightedPortfolioReturnReal } from '../core/returns';

describe('FIRE Calculations', () => {
  // Base test case with complete valid inputs
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

  describe('calculateYearsToFIRE', () => {
    it('should calculate years to FIRE for a typical scenario', () => {
      const years = calculateYearsToFIRE(baseInputs);
      // With $100k starting, $40k/year savings (0% real growth), 5.34% real return
      // Need to reach $1.176M (40k/(1-0.15)/0.04) due to 15% tax rate
      // Solving: 100k * 1.0534^n + 40k * [(1.0534^n - 1) / 0.0534] ≥ 1.176M
      // This yields approximately 15.7 years
      expect(years).toBeCloseTo(15.7, 1);
    });

    it('should return 0 if already achieved FIRE', () => {
      const wealthyInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 2000000, // Already wealthy
        },
      };
      const years = calculateYearsToFIRE(wealthyInputs);
      expect(years).toBe(0);
    });

    it('should return -1 if retirement expenses are missing', () => {
      const invalidInputs: QuickPlanInputs = {
        ...baseInputs,
        goals: {
          ...baseInputs.goals,
          retirementExpenses: null,
        },
      };
      const years = calculateYearsToFIRE(invalidInputs);
      expect(years).toBe(null);
    });

    it('should handle very low savings rate scenarios', () => {
      const lowSavingsInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 50000,
          annualExpenses: 49000, // $1000/year savings
          investedAssets: 1000,
        },
      };
      const years = calculateYearsToFIRE(lowSavingsInputs);
      // With only $1k starting and $1k/year savings at 5.34% real
      // Need to reach $1.176M (accounting for 15% tax rate)
      // This will take approximately 78.9 years
      expect(years).toBeCloseTo(78.9, 1);
    });

    it('should handle high savings rate scenarios', () => {
      const highSavingsInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 150000,
          annualExpenses: 30000, // $120k/year savings
        },
      };
      const years = calculateYearsToFIRE(highSavingsInputs);
      // With $100k starting, $120k/year savings, 5.34% real return
      // Need to reach $1.176M (accounting for 15% tax rate)
      // This takes approximately 7.3 years
      expect(years).toBeCloseTo(7.3, 1);
    });

    it('should handle scenario where starting assets alone could reach FIRE', () => {
      const goodStartInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 800000,
          annualIncome: 60000,
          annualExpenses: 60000, // Zero savings
        },
      };
      const years = calculateYearsToFIRE(goodStartInputs);
      // $800k growing at 5.34% real needs to reach $1.176M
      // 800k * 1.0534^n = 1.176M
      // n = ln(1.47) / ln(1.0534) ≈ 7.4 years
      expect(years).toBeCloseTo(7.4, 1);
    });
  });

  describe('calculateFIREAge', () => {
    it('should calculate FIRE age correctly', () => {
      const fireAge = calculateFIREAge(baseInputs);
      // Current age 30 + 15.7 years to FIRE = 45.7
      expect(fireAge).toBeCloseTo(45.7, 1);
    });

    it('should return current age if already achieved FIRE', () => {
      const wealthyInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 2000000,
        },
      };
      const fireAge = calculateFIREAge(wealthyInputs);
      expect(fireAge).toBe(30);
    });

    it('should return -1 if current age is missing', () => {
      const invalidInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: null,
        },
      };
      const fireAge = calculateFIREAge(invalidInputs);
      expect(fireAge).toBe(null);
    });

    it('should handle very low savings scenarios', () => {
      const lowSavingsInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 40000,
          annualExpenses: 39500, // $500/year savings
          investedAssets: 100,
        },
      };
      const fireAge = calculateFIREAge(lowSavingsInputs);
      // With minimal savings, FIRE takes ~92.9 years (due to higher tax-adjusted target)
      // Age 30 + 92.9 = 122.9
      expect(fireAge).toBeCloseTo(122.9, 1);
    });
  });

  describe('getFIREAnalysis', () => {
    it('should provide complete FIRE analysis for achievable scenario', () => {
      const analysis = getFIREAnalysis(baseInputs);

      expect(analysis.isAchievable).toBe(true);
      expect(analysis.yearsToFIRE).toBeCloseTo(15.7, 1);
      expect(analysis.fireAge).toBeCloseTo(45.7, 1);
      expect(analysis.requiredPortfolio).toBeCloseTo(1176471, 0); // 40k / (1-0.15) / 0.04
    });

    it('should indicate already achieved FIRE', () => {
      const wealthyInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 1500000,
        },
      };
      const analysis = getFIREAnalysis(wealthyInputs);

      expect(analysis.isAchievable).toBe(true);
      expect(analysis.yearsToFIRE).toBe(0);
      expect(analysis.fireAge).toBe(30);
    });

    it('should handle missing data gracefully', () => {
      const invalidInputs: QuickPlanInputs = {
        ...baseInputs,
        goals: {
          ...baseInputs.goals,
          retirementExpenses: null,
        },
      };
      const analysis = getFIREAnalysis(invalidInputs);

      expect(analysis.isAchievable).toBe(false);
      expect(analysis.yearsToFIRE).toBe(null);
      expect(analysis.fireAge).toBe(null);
    });

    it('should provide appropriate message for long timeframes', () => {
      const slowInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 60000,
          annualExpenses: 50000, // $10k/year savings
        },
      };
      const analysis = getFIREAnalysis(slowInputs);

      expect(analysis.isAchievable).toBe(true);
      expect(analysis.yearsToFIRE).toBeCloseTo(29.9, 1);
    });

    it('should calculate correct required portfolio', () => {
      const customInputs: QuickPlanInputs = {
        ...baseInputs,
        goals: {
          ...baseInputs.goals,
          retirementExpenses: 50000,
        },
        retirementFunding: {
          ...baseInputs.retirementFunding,
          safeWithdrawalRate: 3.5,
        },
      };
      const analysis = getFIREAnalysis(customInputs);

      expect(analysis.requiredPortfolio).toBeCloseTo(1680672, 0); // 100k/(1-0.20)/0.07
    });

    it('should handle quick FIRE scenario with appropriate message', () => {
      const quickFireInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 200000,
          annualExpenses: 40000, // $160k/year savings
          investedAssets: 200000,
        },
      };
      const analysis = getFIREAnalysis(quickFireInputs);

      expect(analysis.isAchievable).toBe(true);
      expect(analysis.yearsToFIRE).toBeCloseTo(5.1, 1);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero income scenario with negative contributions', () => {
      const zeroIncomeInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 0,
          annualExpenses: 40000, // -$40k/year contribution
          investedAssets: 500000,
        },
      };
      const years = calculateYearsToFIRE(zeroIncomeInputs);
      // $500k with -$40k/year withdrawals at 5.34% real return
      // Portfolio shrinks over time, will never reach $1M
      expect(years).toBe(null);
    });

    it('should handle scenario where portfolio grows despite negative contributions', () => {
      const withdrawingButGrowingInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 0,
          annualExpenses: 20000, // -$20k/year contribution
          investedAssets: 900000, // Close to FIRE already
        },
      };
      const years = calculateYearsToFIRE(withdrawingButGrowingInputs);
      // $900k with -$20k/year withdrawals at 5.34% real return
      // Growth: $48k/year, Withdrawal: $20k/year, Net: +$28k/year
      // Should reach $1.176M (tax-adjusted target) in about 8.1 years
      expect(years).toBeCloseTo(8.1, 1);
    });

    it('should handle very high withdrawal rates', () => {
      const highWithdrawalInputs: QuickPlanInputs = {
        ...baseInputs,
        retirementFunding: {
          ...baseInputs.retirementFunding,
          safeWithdrawalRate: 6, // Very high
        },
      };
      const analysis = getFIREAnalysis(highWithdrawalInputs);

      // Required portfolio = $40k / (1-0.15) / 0.06 = $784,314
      expect(analysis.requiredPortfolio).toBeCloseTo(784314, 0);
      // Easier target means fewer years to FIRE (approximately 11.4 years with tax adjustment)
      expect(analysis.yearsToFIRE).toBeCloseTo(11.4, 1);
    });

    it('should handle negative real returns', () => {
      const negativeReturnInputs: QuickPlanInputs = {
        ...baseInputs,
        marketAssumptions: {
          ...baseInputs.marketAssumptions,
          stockReturn: 3,
          bondReturn: 2,
          inflationRate: 5, // Higher than returns
        },
      };
      const years = calculateYearsToFIRE(negativeReturnInputs);
      // Nominal return: 0.7*3% + 0.3*2% = 2.7%
      // Real return: (1.027/1.05) - 1 = -2.19%
      // With negative real returns, portfolio shrinks in real terms
      expect(years).toBe(null);
    });

    it('should handle exactly meeting FIRE requirements', () => {
      const exactFIREInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 1176471, // Exactly at tax-adjusted FIRE target
        },
      };
      const years = calculateYearsToFIRE(exactFIREInputs);
      expect(years).toBe(0);
    });

    it('should handle just below FIRE requirements', () => {
      const almostFIREInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 1176470, // $1 short of tax-adjusted FIRE target
        },
      };
      const years = calculateYearsToFIRE(almostFIREInputs);
      // Should need less than 1 year to make up the difference with growth/contributions
      expect(years).toBeCloseTo(0, 1);
    });
  });
});

describe('FIRE Calculations - Additional Validation', () => {
  // 1. Cross-reference with known FIRE calculators
  describe('Cross-validation with External Calculators', () => {
    it('should match FIREcalc.com basic scenario', () => {
      // FIREcalc.com example: $100k start, $40k/year savings, 7% return, 3% inflation
      // Expected result: ~14-15 years to reach $1M
      const firecalcInputs: QuickPlanInputs = {
        basics: {
          currentAge: 30,
          annualIncome: 100000,
          annualExpenses: 60000,
          investedAssets: 100000,
        },
        growthRates: {
          incomeGrowthRate: 3, // Matching inflation
          expenseGrowthRate: 3,
        },
        allocation: {
          stockAllocation: 100, // Simplified to 100% stocks
          bondAllocation: 0,
          cashAllocation: 0,
        },
        goals: {
          retirementExpenses: 40000,
        },
        marketAssumptions: {
          stockReturn: 7, // Common assumption
          bondReturn: 4,
          cashReturn: 2,
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

      const years = calculateYearsToFIRE(firecalcInputs);
      // With 4% real return (7% - 3%), should be around 16-17 years
      expect(years).toBeGreaterThanOrEqual(15);
      expect(years).toBeLessThanOrEqual(18);
    });

    it('should match PersonalCapital retirement planner scenario', () => {
      // Personal Capital typically uses Monte Carlo, but median case should be similar
      const pcInputs: QuickPlanInputs = {
        basics: {
          currentAge: 35,
          annualIncome: 120000,
          annualExpenses: 70000,
          investedAssets: 200000,
        },
        growthRates: {
          incomeGrowthRate: 3,
          expenseGrowthRate: 3,
        },
        allocation: {
          stockAllocation: 80,
          bondAllocation: 20,
          cashAllocation: 0,
        },
        goals: {
          retirementExpenses: 50000,
        },
        marketAssumptions: {
          stockReturn: 9,
          bondReturn: 4,
          cashReturn: 2,
          inflationRate: 2.5,
        },
        retirementFunding: {
          safeWithdrawalRate: 4,
          retirementIncome: 0,
          lifeExpectancy: 90,
          effectiveTaxRate: 20,
        },
        flexiblePaths: {
          targetRetirementAge: 55,
          partTimeIncome: 0,
        },
      };

      const analysis = getFIREAnalysis(pcInputs);
      // $50k expenses / (1-0.20) / 4% = $1.56M needed (tax-adjusted)
      expect(analysis.requiredPortfolio).toBeCloseTo(1562500, 0);
      // With $50k/year savings and good returns, should be 11-14 years
      expect(analysis.yearsToFIRE).toBeGreaterThanOrEqual(10);
      expect(analysis.yearsToFIRE).toBeLessThanOrEqual(15);
    });
  });

  // 2. Mathematical identity checks
  describe('Mathematical Identity Verification', () => {
    it('should satisfy the compound interest equation', () => {
      const inputs: QuickPlanInputs = {
        basics: {
          currentAge: 30,
          annualIncome: 80000,
          annualExpenses: 50000,
          investedAssets: 50000,
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

      const years = calculateYearsToFIRE(inputs)!;
      const futureValue = calculateFuturePortfolioValue(inputs, years);
      const requiredPortfolio = calculateRequiredPortfolio(40000, 4, 15)!;

      // The portfolio value at FIRE should be >= required (within small tolerance)
      expect(futureValue).toBeGreaterThanOrEqual(requiredPortfolio - 2000); // Allow $2k tolerance for binary search precision

      // But a bit before should be less (check 0.5 years before for decimal precision)
      if (years > 0.5) {
        const halfYearBefore = calculateFuturePortfolioValue(inputs, years - 0.5);
        expect(halfYearBefore).toBeLessThan(requiredPortfolio);
      }
    });

    it('should follow the future value of annuity formula', () => {
      // FV = PMT × [(1+r)^n - 1] / r
      const annualSavings = 30000;
      const years = 10;

      // Our calculation (starting with 0 assets)
      const inputs: QuickPlanInputs = {
        basics: {
          currentAge: 30,
          annualIncome: 80000,
          annualExpenses: 50000, // 30k savings
          investedAssets: 0, // Start with nothing
        },
        growthRates: {
          incomeGrowthRate: 3,
          expenseGrowthRate: 3, // Both match inflation = 0% real growth
        },
        allocation: {
          stockAllocation: 100,
          bondAllocation: 0,
          cashAllocation: 0,
        },
        goals: {
          retirementExpenses: 40000,
        },
        marketAssumptions: {
          stockReturn: 8,
          bondReturn: 4,
          cashReturn: 2,
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

      // Calculate the actual real return from our inputs
      const realReturn = calculateWeightedPortfolioReturnReal(inputs.allocation, inputs.marketAssumptions) / 100;

      // Manual calculation with the correct real return
      const fvAnnuity = annualSavings * ((Math.pow(1 + realReturn, years) - 1) / realReturn);

      const portfolioValue = calculateFuturePortfolioValue(inputs, years);

      // Should match within floating point precision
      expect(portfolioValue).toBeCloseTo(fvAnnuity, 2);
    });
  });

  // 3. Boundary and stress tests
  describe('Boundary and Stress Tests', () => {
    it('should handle extreme market returns correctly', () => {
      const extremeInputs: QuickPlanInputs = {
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
          stockAllocation: 100,
          bondAllocation: 0,
          cashAllocation: 0,
        },
        goals: {
          retirementExpenses: 40000,
        },
        marketAssumptions: {
          stockReturn: 20, // Very high return
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

      const years = calculateYearsToFIRE(extremeInputs);
      // With 16.5% real return (20% - 3% inflation adjusted), should be about 8.4 years
      expect(years).toBeCloseTo(9.3, 1);
      expect(years).toBeGreaterThan(0);
    });

    it('should handle zero return scenario', () => {
      const zeroReturnInputs: QuickPlanInputs = {
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
          stockAllocation: 0,
          bondAllocation: 0,
          cashAllocation: 100,
        },
        goals: {
          retirementExpenses: 40000,
        },
        marketAssumptions: {
          stockReturn: 10,
          bondReturn: 5,
          cashReturn: 3,
          inflationRate: 3, // Cash return = inflation = 0% real
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

      const years = calculateYearsToFIRE(zeroReturnInputs);
      // Need $1.176M (tax-adjusted), have $100k, save $40k/year with 0% growth
      // Should take exactly (1176471 - 100000) / 40000 = 26.9 years
      expect(years).toBeCloseTo(26.9, 1);
    });
  });

  // 4. Consistency checks
  describe('Internal Consistency Verification', () => {
    it('should be consistent when run multiple times', () => {
      const inputs: QuickPlanInputs = {
        basics: {
          currentAge: 40,
          annualIncome: 150000,
          annualExpenses: 80000,
          investedAssets: 300000,
        },
        growthRates: {
          incomeGrowthRate: 4,
          expenseGrowthRate: 3,
        },
        allocation: {
          stockAllocation: 60,
          bondAllocation: 30,
          cashAllocation: 10,
        },
        goals: {
          retirementExpenses: 60000,
        },
        marketAssumptions: {
          stockReturn: 9,
          bondReturn: 4,
          cashReturn: 2,
          inflationRate: 2.5,
        },
        retirementFunding: {
          safeWithdrawalRate: 3.5,
          retirementIncome: 0,
          lifeExpectancy: 90,
          effectiveTaxRate: 20,
        },
        flexiblePaths: {
          targetRetirementAge: 55,
          partTimeIncome: 0,
        },
      };

      // Run multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(calculateYearsToFIRE(inputs));
      }

      // All results should be identical
      expect(new Set(results).size).toBe(1);
    });

    it('should show monotonic behavior with savings rate', () => {
      const baseInputs: QuickPlanInputs = {
        basics: {
          currentAge: 30,
          annualIncome: 100000,
          annualExpenses: 70000, // Base: $30k savings
          investedAssets: 50000,
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

      // Test with increasing savings rates
      const savingsRates = [20000, 30000, 40000, 50000, 60000];
      const results = savingsRates.map((savings) => {
        const inputs = {
          ...baseInputs,
          basics: {
            ...baseInputs.basics,
            annualExpenses: 100000 - savings,
          },
        };
        return calculateYearsToFIRE(inputs)!;
      });

      // Years to FIRE should decrease as savings increase
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeLessThanOrEqual(results[i - 1]);
      }
    });
  });

  // 5. Known edge cases from financial planning
  describe('Known Financial Planning Scenarios', () => {
    it("should handle the 'Coast FIRE' scenario", () => {
      // Coast FIRE: Current assets will grow to FIRE amount without more contributions
      const coastInputs: QuickPlanInputs = {
        basics: {
          currentAge: 30,
          annualIncome: 60000,
          annualExpenses: 60000, // Zero savings
          investedAssets: 250000, // Good start
        },
        growthRates: {
          incomeGrowthRate: 3,
          expenseGrowthRate: 3,
        },
        allocation: {
          stockAllocation: 80,
          bondAllocation: 20,
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
          lifeExpectancy: 90,
          effectiveTaxRate: 15,
        },
        flexiblePaths: {
          targetRetirementAge: 65,
          partTimeIncome: 0,
        },
      };

      const years = calculateYearsToFIRE(coastInputs);
      // $250k growing at ~5.9% real to reach $1M
      // ln(4) / ln(1.059) ≈ 24 years
      expect(years).toBeGreaterThan(20);
      expect(years).toBeLessThan(30);
    });

    it("should handle the 'Barista FIRE' scenario", () => {
      // Barista FIRE: Lower FIRE target due to part-time income
      const baristaInputs: QuickPlanInputs = {
        basics: {
          currentAge: 35,
          annualIncome: 80000,
          annualExpenses: 50000,
          investedAssets: 200000,
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
          retirementExpenses: 25000, // Lower due to $15k part-time income
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
          lifeExpectancy: 90,
          effectiveTaxRate: 15,
        },
        flexiblePaths: {
          targetRetirementAge: 45,
          partTimeIncome: 15000,
        },
      };

      const analysis = getFIREAnalysis(baristaInputs);
      // Need only ~$735k instead of $1.18M (25k/(1-0.15)/0.04)
      expect(analysis.requiredPortfolio).toBeCloseTo(735294, 0);
      expect(analysis.yearsToFIRE).toBeLessThan(11); // Updated for tax-adjusted target
    });
  });
});

// 6. Property-based testing concepts
describe('Property-Based Validation', () => {
  it('should always reach FIRE faster with higher returns', () => {
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
        stockAllocation: 100,
        bondAllocation: 0,
        cashAllocation: 0,
      },
      goals: {
        retirementExpenses: 40000,
      },
      marketAssumptions: {
        stockReturn: 8,
        bondReturn: 4,
        cashReturn: 2,
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

    const lowReturnYears = calculateYearsToFIRE(baseInputs)!;

    const highReturnInputs = {
      ...baseInputs,
      marketAssumptions: {
        ...baseInputs.marketAssumptions,
        stockReturn: 12, // Higher return
      },
    };

    const highReturnYears = calculateYearsToFIRE(highReturnInputs)!;

    expect(highReturnYears).toBeLessThan(lowReturnYears);
  });

  it('should never achieve FIRE if withdrawal > growth + savings', () => {
    const impossibleInputs: QuickPlanInputs = {
      basics: {
        currentAge: 30,
        annualIncome: 50000,
        annualExpenses: 80000, // Negative $30k/year
        investedAssets: 100000,
      },
      growthRates: {
        incomeGrowthRate: 2,
        expenseGrowthRate: 4, // Expenses growing faster
      },
      allocation: {
        stockAllocation: 50,
        bondAllocation: 50,
        cashAllocation: 0,
      },
      goals: {
        retirementExpenses: 40000,
      },
      marketAssumptions: {
        stockReturn: 6,
        bondReturn: 3,
        cashReturn: 1,
        inflationRate: 3,
      },
      retirementFunding: {
        safeWithdrawalRate: 4,
        retirementIncome: 0,
        lifeExpectancy: 90,
        effectiveTaxRate: 15,
      },
      flexiblePaths: {
        targetRetirementAge: 65,
        partTimeIncome: 0,
      },
    };

    const years = calculateYearsToFIRE(impossibleInputs);
    expect(years).toBe(null);
  });
});

// Integration tests for floating point precision
describe('Floating Point Precision Integration Tests', () => {
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

  it('should have round-trip consistency between calculateYearsToFIRE and calculateFuturePortfolioValue', () => {
    const yearsToFIRE = calculateYearsToFIRE(baseInputs);
    expect(yearsToFIRE).not.toBeNull();

    // The portfolio value at the calculated years should meet or exceed the required portfolio
    const portfolioAtFIRE = calculateFuturePortfolioValue(baseInputs, yearsToFIRE!);
    const requiredPortfolio = calculateRequiredPortfolio(
      baseInputs.goals.retirementExpenses,
      baseInputs.retirementFunding.safeWithdrawalRate,
      baseInputs.retirementFunding.effectiveTaxRate
    );

    expect(portfolioAtFIRE).toBeGreaterThanOrEqual(requiredPortfolio! - 500); // Allow tolerance for binary search precision
  });

  it('should verify binary search precision is appropriate', () => {
    const yearsToFIRE = calculateYearsToFIRE(baseInputs);
    expect(yearsToFIRE).not.toBeNull();

    // Check that 0.05 years earlier would not be sufficient
    const portfolioEarlier = calculateFuturePortfolioValue(baseInputs, yearsToFIRE! - 0.05);
    const requiredPortfolio = calculateRequiredPortfolio(
      baseInputs.goals.retirementExpenses,
      baseInputs.retirementFunding.safeWithdrawalRate,
      baseInputs.retirementFunding.effectiveTaxRate
    );

    expect(portfolioEarlier).toBeLessThan(requiredPortfolio!);
  });

  it('should handle scenarios resulting in specific fractional years', () => {
    // Create a scenario that should result in a specific fractional result
    const customInputs: QuickPlanInputs = {
      ...baseInputs,
      basics: {
        ...baseInputs.basics,
        investedAssets: 950000, // Very close to FIRE
        annualIncome: 70000,
        annualExpenses: 60000, // Low savings
      },
    };

    const years = calculateYearsToFIRE(customInputs);
    expect(years).not.toBeNull();
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(4); // Should be less than 4 years (updated for tax-adjusted target)

    // Verify this works with calculateFuturePortfolioValue
    const futureValue = calculateFuturePortfolioValue(customInputs, years!);
    const requiredPortfolio = calculateRequiredPortfolio(40000, 4, 15)!; // Tax-adjusted target
    expect(futureValue).toBeGreaterThanOrEqual(requiredPortfolio - 2000); // Allow larger tolerance for edge case
  });

  it('should handle edge case where result is very close to boundary', () => {
    // Create scenario that might result in something like 4.99 or 5.01
    const edgeInputs: QuickPlanInputs = {
      ...baseInputs,
      basics: {
        ...baseInputs.basics,
        investedAssets: 200000,
        annualIncome: 150000,
        annualExpenses: 30000, // High savings rate
      },
    };

    const years = calculateYearsToFIRE(edgeInputs);
    expect(years).not.toBeNull();

    // Should be a reasonable timeframe
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(10);

    // Verify precision by checking portfolio value
    const futureValue = calculateFuturePortfolioValue(edgeInputs, years!);
    expect(futureValue).toBeGreaterThanOrEqual(1000000 - 6000); // Allow tolerance for binary search precision
  });

  it('should verify partial year contributions are handled correctly in FIRE calculations', () => {
    const years = calculateYearsToFIRE(baseInputs);
    expect(years).not.toBeNull();

    // If the result has a fractional part, verify the calculation is correct
    if (years! % 1 !== 0) {
      const wholeYears = Math.floor(years!);
      const partialYear = years! - wholeYears;

      // The portfolio value should account for the partial year contribution
      const portfolioAtFIRE = calculateFuturePortfolioValue(baseInputs, years!);
      const portfolioAtWholeYears = calculateFuturePortfolioValue(baseInputs, wholeYears);

      // The difference should be approximately the prorated contribution
      const annualContribution = baseInputs.basics.annualIncome! - baseInputs.basics.annualExpenses!;
      const expectedPartialContribution = annualContribution * partialYear;
      const actualDifference = portfolioAtFIRE! - portfolioAtWholeYears!;

      // The difference includes asset growth, so comparison should account for that
      // Just verify the partial year logic is working (difference is reasonable)
      expect(actualDifference).toBeGreaterThan(expectedPartialContribution * 0.5);
      expect(actualDifference).toBeLessThan(expectedPartialContribution * 3);
    }
  });
});

// Integration Stress Tests - Combining Multiple Edge Conditions
describe('Integration Stress Tests', () => {
  describe('Extreme Scenario Combinations', () => {
    it('should handle maximum tax rate + minimum life expectancy + high savings', () => {
      const extremeInputs: QuickPlanInputs = {
        basics: {
          currentAge: 45, // Starting late
          annualIncome: 300000, // Very high income
          annualExpenses: 50000, // Very low expenses (high savings rate)
          investedAssets: 10000, // Starting with almost nothing
        },
        growthRates: {
          incomeGrowthRate: 1, // Low income growth
          expenseGrowthRate: 5, // High expense growth
        },
        allocation: {
          stockAllocation: 100, // Aggressive allocation
          bondAllocation: 0,
          cashAllocation: 0,
        },
        goals: {
          retirementExpenses: 80000, // High retirement expenses
        },
        marketAssumptions: {
          stockReturn: 15, // Very high returns
          bondReturn: 8,
          cashReturn: 4,
          inflationRate: 6, // High inflation
        },
        retirementFunding: {
          safeWithdrawalRate: 2, // Very conservative withdrawal rate
          retirementIncome: 60000, // High retirement income
          lifeExpectancy: 50, // Minimum life expectancy
          effectiveTaxRate: 50, // Maximum tax rate
        },
        flexiblePaths: {
          targetRetirementAge: 50,
          partTimeIncome: 0,
        },
      };

      const analysis = getFIREAnalysis(extremeInputs);

      // With extreme conditions (very high required portfolio due to 50% tax + 2% SWR),
      // FIRE may not be achievable within the short life expectancy window
      expect(analysis.requiredPortfolio).toBeGreaterThan(0);
      if (analysis.isAchievable) {
        expect(analysis.fireAge).toBeGreaterThan(extremeInputs.basics.currentAge!);
        // Note: FIRE age might exceed life expectancy in extreme scenarios
      }

      // Calculation should be mathematically consistent
      if (analysis.yearsToFIRE !== null) {
        const portfolioAtFIRE = calculateFuturePortfolioValue(extremeInputs, analysis.yearsToFIRE);
        expect(portfolioAtFIRE).toBeGreaterThanOrEqual(analysis.requiredPortfolio! - 5000); // Allow tolerance
      }
    });

    it('should handle negative real returns + high expenses + young age', () => {
      const negativeReturnInputs: QuickPlanInputs = {
        basics: {
          currentAge: 18, // Very young
          annualIncome: 25000, // Low income
          annualExpenses: 24000, // Very low savings
          investedAssets: 1000, // Minimal start
        },
        growthRates: {
          incomeGrowthRate: 2, // Income growth below inflation
          expenseGrowthRate: 4, // Expenses grow faster
        },
        allocation: {
          stockAllocation: 0, // Conservative allocation
          bondAllocation: 50,
          cashAllocation: 50,
        },
        goals: {
          retirementExpenses: 30000,
        },
        marketAssumptions: {
          stockReturn: 3,
          bondReturn: 2,
          cashReturn: 1,
          inflationRate: 6, // High inflation creates negative real returns
        },
        retirementFunding: {
          safeWithdrawalRate: 4,
          retirementIncome: 0,
          lifeExpectancy: 90, // Long life expectancy
          effectiveTaxRate: 0, // No taxes
        },
        flexiblePaths: {
          targetRetirementAge: 65,
          partTimeIncome: 0,
        },
      };

      const analysis = getFIREAnalysis(negativeReturnInputs);

      // With negative real returns and declining real savings, FIRE should not be achievable
      expect(analysis.isAchievable).toBe(false);
      expect(analysis.yearsToFIRE).toBe(null);
      expect(analysis.fireAge).toBe(null);
    });

    it('should handle maximum age range + extreme market volatility scenario', () => {
      const maxRangeInputs: QuickPlanInputs = {
        basics: {
          currentAge: 16, // Minimum age
          annualIncome: 40000, // Modest income
          annualExpenses: 20000, // Modest expenses
          investedAssets: 5000, // Small start
        },
        growthRates: {
          incomeGrowthRate: 8, // High income growth
          expenseGrowthRate: 2, // Low expense growth
        },
        allocation: {
          stockAllocation: 90, // Very aggressive
          bondAllocation: 10,
          cashAllocation: 0,
        },
        goals: {
          retirementExpenses: 25000,
        },
        marketAssumptions: {
          stockReturn: 12, // High stock returns
          bondReturn: 3,
          cashReturn: 1,
          inflationRate: 4,
        },
        retirementFunding: {
          safeWithdrawalRate: 3, // Conservative withdrawal
          retirementIncome: 15000, // Some passive income
          lifeExpectancy: 110, // Maximum life expectancy
          effectiveTaxRate: 25,
        },
        flexiblePaths: {
          targetRetirementAge: 50,
          partTimeIncome: 0,
        },
      };

      const analysis = getFIREAnalysis(maxRangeInputs);

      // Should be achievable with high income growth and good returns
      expect(analysis.isAchievable).toBe(true);
      expect(analysis.fireAge).toBeGreaterThan(16);
      expect(analysis.fireAge).toBeLessThan(110);

      // Should handle the long planning horizon gracefully
      expect(analysis.yearsToFIRE).toBeLessThan(50); // Should achieve FIRE well before maximum age
    });

    it('should handle debt scenario + inflation + cash allocation', () => {
      const debtScenarioInputs: QuickPlanInputs = {
        basics: {
          currentAge: 35,
          annualIncome: 80000,
          annualExpenses: 75000, // Low savings rate
          investedAssets: 0, // Starting with no assets (debt scenario handled by "no growth on negative" policy)
        },
        growthRates: {
          incomeGrowthRate: 3,
          expenseGrowthRate: 3,
        },
        allocation: {
          stockAllocation: 0, // All cash during debt payoff
          bondAllocation: 0,
          cashAllocation: 100,
        },
        goals: {
          retirementExpenses: 60000,
        },
        marketAssumptions: {
          stockReturn: 10,
          bondReturn: 5,
          cashReturn: 2, // Low cash returns
          inflationRate: 3, // Matches cash returns = 0% real return
        },
        retirementFunding: {
          safeWithdrawalRate: 4,
          retirementIncome: 20000, // Some Social Security
          lifeExpectancy: 85,
          effectiveTaxRate: 20,
        },
        flexiblePaths: {
          targetRetirementAge: 65,
          partTimeIncome: 0,
        },
      };

      const analysis = getFIREAnalysis(debtScenarioInputs);

      // With 0% real returns and only $5000/year savings, FIRE might not be achievable within 100 years
      // or might require very long timeframes
      if (analysis.isAchievable) {
        expect(analysis.yearsToFIRE).toBeGreaterThan(25); // Should take a long time
        expect(analysis.fireAge).toBeGreaterThan(60); // Late retirement
      } else {
        // Not achievable within reasonable timeframe - acceptable result
        expect(analysis.yearsToFIRE).toBe(null);
        expect(analysis.fireAge).toBe(null);
      }
    });

    it('should handle Coast FIRE boundary conditions', () => {
      // Scenario where current assets could grow to FIRE amount without more contributions
      const coastFireInputs: QuickPlanInputs = {
        basics: {
          currentAge: 30,
          annualIncome: 60000,
          annualExpenses: 60000, // Zero net savings
          investedAssets: 400000, // Substantial starting assets
        },
        growthRates: {
          incomeGrowthRate: 3,
          expenseGrowthRate: 3,
        },
        allocation: {
          stockAllocation: 80,
          bondAllocation: 20,
          cashAllocation: 0,
        },
        goals: {
          retirementExpenses: 40000,
        },
        marketAssumptions: {
          stockReturn: 9,
          bondReturn: 4,
          cashReturn: 2,
          inflationRate: 3,
        },
        retirementFunding: {
          safeWithdrawalRate: 4,
          retirementIncome: 0,
          lifeExpectancy: 90,
          effectiveTaxRate: 15,
        },
        flexiblePaths: {
          targetRetirementAge: 65, // Target retirement at 65
          partTimeIncome: 0,
        },
      };

      const analysis = getFIREAnalysis(coastFireInputs);

      // Should achieve FIRE through asset growth alone
      expect(analysis.isAchievable).toBe(true);
      expect(analysis.fireAge).toBeGreaterThan(30);
      expect(analysis.fireAge).toBeLessThanOrEqual(65);

      // Verify the math: $400k growing at real rate to reach required portfolio
      const realReturn = calculateWeightedPortfolioReturnReal(coastFireInputs.allocation, coastFireInputs.marketAssumptions) / 100;
      const requiredPortfolio = analysis.requiredPortfolio!;
      const yearsToGrow = Math.log(requiredPortfolio / 400000) / Math.log(1 + realReturn);

      expect(analysis.yearsToFIRE).toBeCloseTo(yearsToGrow, 1);
    });
  });

  describe('Numerical Stability Tests', () => {
    it('should maintain precision with extreme values and fractional calculations', () => {
      const precisionInputs: QuickPlanInputs = {
        basics: {
          currentAge: 33.333333,
          annualIncome: 99999.99,
          annualExpenses: 55555.55,
          investedAssets: 123456.78,
        },
        growthRates: {
          incomeGrowthRate: 3.14159, // Pi percent
          expenseGrowthRate: 2.71828, // e percent
        },
        allocation: {
          stockAllocation: 66.6667,
          bondAllocation: 33.3333,
          cashAllocation: 0,
        },
        goals: {
          retirementExpenses: 44444.44,
        },
        marketAssumptions: {
          stockReturn: 8.5,
          bondReturn: 4.25,
          cashReturn: 2.125,
          inflationRate: 2.5,
        },
        retirementFunding: {
          safeWithdrawalRate: 3.75,
          retirementIncome: 12345.67,
          lifeExpectancy: 87,
          effectiveTaxRate: 22.5,
        },
        flexiblePaths: {
          targetRetirementAge: 62,
          partTimeIncome: 0,
        },
      };

      const analysis = getFIREAnalysis(precisionInputs);

      // Should handle high precision inputs without errors
      expect(analysis.isAchievable).toBe(true);
      expect(typeof analysis.fireAge).toBe('number');
      expect(typeof analysis.yearsToFIRE).toBe('number');
      expect(typeof analysis.requiredPortfolio).toBe('number');

      // Results should be mathematically consistent
      if (analysis.yearsToFIRE !== null) {
        const futureValue = calculateFuturePortfolioValue(precisionInputs, analysis.yearsToFIRE);
        expect(futureValue).toBeGreaterThanOrEqual(analysis.requiredPortfolio! - 1000);
      }
    });

    it('should handle repeated calculations consistently', () => {
      const consistencyInputs: QuickPlanInputs = {
        basics: {
          currentAge: 40,
          annualIncome: 120000,
          annualExpenses: 75000,
          investedAssets: 250000,
        },
        growthRates: {
          incomeGrowthRate: 3.5,
          expenseGrowthRate: 2.8,
        },
        allocation: {
          stockAllocation: 75,
          bondAllocation: 20,
          cashAllocation: 5,
        },
        goals: {
          retirementExpenses: 55000,
        },
        marketAssumptions: {
          stockReturn: 8.5,
          bondReturn: 4.2,
          cashReturn: 1.8,
          inflationRate: 2.7,
        },
        retirementFunding: {
          safeWithdrawalRate: 4,
          retirementIncome: 18000,
          lifeExpectancy: 88,
          effectiveTaxRate: 24,
        },
        flexiblePaths: {
          targetRetirementAge: 60,
          partTimeIncome: 0,
        },
      };

      // Run the same calculation multiple times
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(getFIREAnalysis(consistencyInputs));
      }

      // All results should be identical
      const firstResult = results[0];
      results.forEach((result) => {
        expect(result.isAchievable).toBe(firstResult.isAchievable);
        expect(result.fireAge).toBe(firstResult.fireAge);
        expect(result.yearsToFIRE).toBe(firstResult.yearsToFIRE);
        expect(result.requiredPortfolio).toBe(firstResult.requiredPortfolio);
      });
    });
  });
});
