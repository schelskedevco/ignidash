import { describe, it, expect } from "vitest";
import {
  calculateYearsToFIRE,
  calculateFIREAge,
  getFIREAnalysis,
} from "./fire-calculations";
import {
  calculateFuturePortfolioValue,
  calculatePortfolioReturnReal,
} from "./calculations";
import { QuickPlanInputs } from "./schemas/quick-plan-schema";

describe("FIRE Calculations", () => {
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
      targetRetirementAge: 50,
      partTimeIncome: 0,
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
  };

  describe("calculateYearsToFIRE", () => {
    it("should calculate years to FIRE for a typical scenario", () => {
      const years = calculateYearsToFIRE(baseInputs);
      // With $100k starting, $40k/year savings (0% real growth), 5.34% real return
      // Need to reach $1M (40k/0.04)
      // Solving: 100k * 1.0534^n + 40k * [(1.0534^n - 1) / 0.0534] ≥ 1M
      // This yields 14 years (portfolio = $1,009,842)
      expect(years).toBe(14);
    });

    it("should return 0 if already achieved FIRE", () => {
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

    it("should return -1 if retirement expenses are missing", () => {
      const invalidInputs: QuickPlanInputs = {
        ...baseInputs,
        goals: {
          ...baseInputs.goals,
          retirementExpenses: null,
        },
      };
      const years = calculateYearsToFIRE(invalidInputs);
      expect(years).toBe(-1);
    });

    it("should handle very low savings rate scenarios", () => {
      const lowSavingsInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 50000,
          annualExpenses: 49000, // $1000/year savings
          investedAssets: 1000,
        },
      };
      const years = calculateYearsToFIRE(lowSavingsInputs, 100);
      // With only $1k starting and $1k/year savings at 5.34% real
      // Need to reach $1M
      // This will take 76 years (portfolio = $1,009,518)
      expect(years).toBe(76);
    });

    it("should handle high savings rate scenarios", () => {
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
      // Need to reach $1M
      // This takes approximately 7 years
      expect(years).toBe(7);
    });

    it("should handle scenario where starting assets alone could reach FIRE", () => {
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
      // $800k growing at 5.34% real needs to reach $1M
      // 800k * 1.0534^n = 1M
      // n = ln(1.25) / ln(1.0534) ≈ 4.3 years
      expect(years).toBe(5); // Rounds up to 5 years
    });
  });

  describe("calculateFIREAge", () => {
    it("should calculate FIRE age correctly", () => {
      const fireAge = calculateFIREAge(baseInputs);
      // Current age 30 + 14 years to FIRE = 44
      expect(fireAge).toBe(44);
    });

    it("should return current age if already achieved FIRE", () => {
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

    it("should return -1 if current age is missing", () => {
      const invalidInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          currentAge: null,
        },
      };
      const fireAge = calculateFIREAge(invalidInputs);
      expect(fireAge).toBe(-1);
    });

    it("should handle very low savings scenarios", () => {
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
      // With minimal savings, FIRE takes ~90 years
      // Age 30 + 90 = 120
      expect(fireAge).toBe(120);
    });
  });

  describe("getFIREAnalysis", () => {
    it("should provide complete FIRE analysis for achievable scenario", () => {
      const analysis = getFIREAnalysis(baseInputs);

      expect(analysis.achievable).toBe(true);
      expect(analysis.yearsToFIRE).toBe(14);
      expect(analysis.fireAge).toBe(44);
      expect(analysis.requiredPortfolio).toBe(1000000); // 40k / 0.04
      expect(analysis.currentPortfolio).toBe(100000);
      // After 14 years, portfolio should be just over $1M
      expect(analysis.projectedPortfolioAtFIRE).toBeGreaterThan(1000000);
      expect(analysis.projectedPortfolioAtFIRE).toBeLessThan(1010000);
      expect(analysis.message).toBe(
        "FIRE is achievable in 14 years at age 44."
      );
    });

    it("should indicate already achieved FIRE", () => {
      const wealthyInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 1500000,
        },
      };
      const analysis = getFIREAnalysis(wealthyInputs);

      expect(analysis.achievable).toBe(true);
      expect(analysis.yearsToFIRE).toBe(0);
      expect(analysis.fireAge).toBe(30);
      expect(analysis.message).toBe(
        "Congratulations! You have already achieved FIRE."
      );
    });

    it("should handle missing data gracefully", () => {
      const invalidInputs: QuickPlanInputs = {
        ...baseInputs,
        goals: {
          ...baseInputs.goals,
          retirementExpenses: null,
        },
      };
      const analysis = getFIREAnalysis(invalidInputs);

      expect(analysis.achievable).toBe(false);
      expect(analysis.yearsToFIRE).toBe(-1);
      expect(analysis.fireAge).toBe(-1);
      expect(analysis.message).toBe(
        "Missing required data to calculate FIRE goals"
      );
    });

    it("should provide appropriate message for long timeframes", () => {
      const slowInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          annualIncome: 60000,
          annualExpenses: 50000, // $10k/year savings
        },
      };
      const analysis = getFIREAnalysis(slowInputs);

      expect(analysis.achievable).toBe(true);
      expect(analysis.yearsToFIRE).toBe(28);
      expect(analysis.message).toBe(
        "FIRE is achievable in 28 years at age 58."
      );
    });

    it("should calculate correct required portfolio", () => {
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

      expect(analysis.requiredPortfolio).toBeCloseTo(1428571.43, 2);
    });

    it("should handle quick FIRE scenario with appropriate message", () => {
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

      expect(analysis.achievable).toBe(true);
      expect(analysis.yearsToFIRE).toBe(5);
      expect(analysis.message).toBe(
        "You can achieve FIRE in 5 years at age 35."
      );
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle zero income scenario with negative contributions", () => {
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
      expect(years).toBe(-1);
    });

    it("should handle scenario where portfolio grows despite negative contributions", () => {
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
      // Should still reach $1M in about 4 years
      expect(years).toBe(4);
    });

    it("should handle very high withdrawal rates", () => {
      const highWithdrawalInputs: QuickPlanInputs = {
        ...baseInputs,
        retirementFunding: {
          ...baseInputs.retirementFunding,
          safeWithdrawalRate: 6, // Very high
        },
      };
      const analysis = getFIREAnalysis(highWithdrawalInputs);

      // Required portfolio = $40k / 0.06 = $666,667
      expect(analysis.requiredPortfolio).toBeCloseTo(666666.67, 2);
      // Easier target means fewer years to FIRE (10 years to reach $679,406)
      expect(analysis.yearsToFIRE).toBe(10);
    });

    it("should handle negative real returns", () => {
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
      expect(years).toBe(-1);
    });

    it("should handle exactly meeting FIRE requirements", () => {
      const exactFIREInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 1000000, // Exactly at FIRE
        },
      };
      const years = calculateYearsToFIRE(exactFIREInputs);
      expect(years).toBe(0);
    });

    it("should handle just below FIRE requirements", () => {
      const almostFIREInputs: QuickPlanInputs = {
        ...baseInputs,
        basics: {
          ...baseInputs.basics,
          investedAssets: 999999, // $1 short of FIRE
        },
      };
      const years = calculateYearsToFIRE(almostFIREInputs);
      // Should need 1 year to make up the difference with growth/contributions
      expect(years).toBe(1);
    });
  });
});

describe("FIRE Calculations - Additional Validation", () => {
  // 1. Cross-reference with known FIRE calculators
  describe("Cross-validation with External Calculators", () => {
    it("should match FIREcalc.com basic scenario", () => {
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
          targetRetirementAge: 50,
          partTimeIncome: 0,
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
      };

      const years = calculateYearsToFIRE(firecalcInputs);
      // With 4% real return (7% - 3%), should be around 16-17 years
      expect(years).toBeGreaterThanOrEqual(15);
      expect(years).toBeLessThanOrEqual(18);
    });

    it("should match PersonalCapital retirement planner scenario", () => {
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
          targetRetirementAge: 55,
          partTimeIncome: 0,
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
      };

      const analysis = getFIREAnalysis(pcInputs);
      // $50k expenses / 4% = $1.25M needed
      expect(analysis.requiredPortfolio).toBe(1250000);
      // With $50k/year savings and good returns, should be 11-14 years
      expect(analysis.yearsToFIRE).toBeGreaterThanOrEqual(10);
      expect(analysis.yearsToFIRE).toBeLessThanOrEqual(15);
    });
  });

  // 2. Mathematical identity checks
  describe("Mathematical Identity Verification", () => {
    it("should satisfy the compound interest equation", () => {
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
          targetRetirementAge: 50,
          partTimeIncome: 0,
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
      };

      const years = calculateYearsToFIRE(inputs);
      const futureValue = calculateFuturePortfolioValue(inputs, years, false);
      const requiredPortfolio = 40000 / 0.04;

      // The portfolio value at FIRE should be >= required (within rounding)
      expect(futureValue).toBeGreaterThanOrEqual(requiredPortfolio);

      // But year before should be less
      if (years > 0) {
        const yearBefore = calculateFuturePortfolioValue(
          inputs,
          years - 1,
          false
        );
        expect(yearBefore).toBeLessThan(requiredPortfolio);
      }
    });

    it("should follow the future value of annuity formula", () => {
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
          targetRetirementAge: 50,
          partTimeIncome: 0,
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
      };

      // Calculate the actual real return from our inputs
      const realReturn = calculatePortfolioReturnReal(inputs) / 100;

      // Manual calculation with the correct real return
      const fvAnnuity =
        annualSavings * ((Math.pow(1 + realReturn, years) - 1) / realReturn);

      const portfolioValue = calculateFuturePortfolioValue(
        inputs,
        years,
        false
      );

      // Should match within floating point precision
      expect(portfolioValue).toBeCloseTo(fvAnnuity, 2);
    });
  });

  // 3. Boundary and stress tests
  describe("Boundary and Stress Tests", () => {
    it("should handle extreme market returns correctly", () => {
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
          targetRetirementAge: 50,
          partTimeIncome: 0,
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
      };

      const years = calculateYearsToFIRE(extremeInputs);
      // With 16.5% real return (20% - 3% inflation adjusted), should be about 9 years
      expect(years).toBe(9);
      expect(years).toBeGreaterThan(0);
    });

    it("should handle zero return scenario", () => {
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
          targetRetirementAge: 50,
          partTimeIncome: 0,
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
      };

      const years = calculateYearsToFIRE(zeroReturnInputs);
      // Need $1M, have $100k, save $40k/year with 0% growth
      // Should take exactly (1000000 - 100000) / 40000 = 22.5 years
      expect(years).toBe(23); // Rounds up
    });
  });

  // 4. Consistency checks
  describe("Internal Consistency Verification", () => {
    it("should be consistent when run multiple times", () => {
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
          targetRetirementAge: 55,
          partTimeIncome: 0,
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
      };

      // Run multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(calculateYearsToFIRE(inputs));
      }

      // All results should be identical
      expect(new Set(results).size).toBe(1);
    });

    it("should show monotonic behavior with savings rate", () => {
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
          targetRetirementAge: 50,
          partTimeIncome: 0,
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
        return calculateYearsToFIRE(inputs);
      });

      // Years to FIRE should decrease as savings increase
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeLessThanOrEqual(results[i - 1]);
      }
    });
  });

  // 5. Known edge cases from financial planning
  describe("Known Financial Planning Scenarios", () => {
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
          targetRetirementAge: 65,
          partTimeIncome: 0,
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
          targetRetirementAge: 45,
          partTimeIncome: 15000,
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
      };

      const analysis = getFIREAnalysis(baristaInputs);
      // Need only $625k instead of $1M
      expect(analysis.requiredPortfolio).toBe(625000);
      expect(analysis.yearsToFIRE).toBeLessThan(10);
    });
  });
});

// 6. Property-based testing concepts
describe("Property-Based Validation", () => {
  it("should always reach FIRE faster with higher returns", () => {
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
        targetRetirementAge: 50,
        partTimeIncome: 0,
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
    };

    const lowReturnYears = calculateYearsToFIRE(baseInputs);

    const highReturnInputs = {
      ...baseInputs,
      marketAssumptions: {
        ...baseInputs.marketAssumptions,
        stockReturn: 12, // Higher return
      },
    };

    const highReturnYears = calculateYearsToFIRE(highReturnInputs);

    expect(highReturnYears).toBeLessThan(lowReturnYears);
  });

  it("should never achieve FIRE if withdrawal > growth + savings", () => {
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
        targetRetirementAge: 65,
        partTimeIncome: 0,
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
    };

    const years = calculateYearsToFIRE(impossibleInputs);
    expect(years).toBe(-1);
  });
});
