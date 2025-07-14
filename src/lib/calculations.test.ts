import { describe, it, expect, vi } from "vitest";
import {
  calculateRequiredPortfolio,
  calculatePortfolioReturnNominal,
  calculatePortfolioReturnReal,
  calculateYearlyContribution,
} from "./calculations";
import { defaultState } from "./stores/quick-plan-store";

describe("calculateRequiredPortfolio", () => {
  it("should return 1,000,000 for 40,000 retirement expenses with 4% SWR", () => {
    const inputs = {
      ...defaultState.inputs,
      goals: {
        ...defaultState.inputs.goals,
        retirementExpenses: 40000,
      },
    };

    const result = calculateRequiredPortfolio(inputs);
    expect(result).toBe(1000000);
  });

  it("should warn and return -1 when retirementExpenses is null", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      goals: {
        ...defaultState.inputs.goals,
        retirementExpenses: null,
      },
    };

    const result = calculateRequiredPortfolio(inputs);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Cannot calculate required portfolio: retirement expenses is required"
    );
    expect(result).toBe(-1);
    consoleSpy.mockRestore();
  });
});

describe("calculatePortfolioReturnNominal", () => {
  it("should calculate correct nominal portfolio return", () => {
    const inputs = {
      ...defaultState.inputs,
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
      },
    };

    const result = calculatePortfolioReturnNominal(inputs);

    // Expected calculation:
    // Stock: 70% × 10% = 0.70 × 0.10 = 0.07
    // Bond: 30% × 5% = 0.30 × 0.05 = 0.015
    // Cash: 0% × 3% = 0.00 × 0.03 = 0.00
    // Total: 0.07 + 0.015 + 0.00 = 0.085 = 8.5%
    expect(result).toBe(8.5);
  });

  it("should handle 100% stock allocation", () => {
    const inputs = {
      ...defaultState.inputs,
      allocation: {
        stockAllocation: 100,
        bondAllocation: 0,
        cashAllocation: 0,
      },
    };
    expect(calculatePortfolioReturnNominal(inputs)).toBe(10);
  });

  it("should warn when allocations don't sum to 100%", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      allocation: {
        stockAllocation: 60,
        bondAllocation: 30,
        cashAllocation: 5, // Total: 95%
      },
    };

    calculatePortfolioReturnNominal(inputs);
    expect(consoleSpy).toHaveBeenCalledWith("Allocations sum to 95%, not 100%");
    consoleSpy.mockRestore();
  });
});

describe("calculatePortfolioReturnReal", () => {
  it("should calculate correct real portfolio return with default values", () => {
    const inputs = {
      ...defaultState.inputs,
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
    };

    const result = calculatePortfolioReturnReal(inputs);

    // Expected calculation:
    // Nominal return: 8.5%
    // Real return: (1.085 / 1.03) - 1 = 0.05339... = 5.339...%
    expect(result).toBeCloseTo(5.339, 2);
  });

  it("should handle zero inflation (real return equals nominal return)", () => {
    const inputs = {
      ...defaultState.inputs,
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        inflationRate: 0,
      },
    };

    const nominalReturn = calculatePortfolioReturnNominal(inputs);
    const realReturn = calculatePortfolioReturnReal(inputs);

    // With 0% inflation, real return should equal nominal return
    // Use toBeCloseTo to handle floating-point precision
    expect(realReturn).toBeCloseTo(nominalReturn, 10);
  });

  it("should handle high inflation scenario (negative real returns)", () => {
    const inputs = {
      ...defaultState.inputs,
      allocation: {
        stockAllocation: 0,
        bondAllocation: 0,
        cashAllocation: 100, // 100% cash allocation
      },
      marketAssumptions: {
        ...defaultState.inputs.marketAssumptions,
        cashReturn: 3,
        inflationRate: 5,
      },
    };

    const result = calculatePortfolioReturnReal(inputs);

    // Expected calculation:
    // Nominal return: 3%
    // Real return: (1.03 / 1.05) - 1 = -0.01904... = -1.904...%
    expect(result).toBeCloseTo(-1.905, 2);
  });
});

describe("calculateYearlyContribution", () => {
  it("should calculate correct contribution for year 0 (base year)", () => {
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

  it("should calculate correct contribution for year 1", () => {
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

    const result = calculateYearlyContribution(inputs, 1);

    // Year 1: (100,000 × 1.03) - (60,000 × 1.03) = 103,000 - 61,800 = 41,200
    expect(result).toBe(41200);
  });

  it("should handle different growth rates for income and expenses", () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 100000,
        annualExpenses: 60000,
      },
      growthRates: {
        incomeGrowthRate: 5, // Higher income growth
        expenseGrowthRate: 2, // Lower expense growth
      },
    };

    const result = calculateYearlyContribution(inputs, 1);

    // Year 1: (100,000 × 1.05) - (60,000 × 1.02) = 105,000 - 61,200 = 43,800
    expect(result).toBe(43800);
  });

  it("should handle multiple years with compounding", () => {
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

    const result = calculateYearlyContribution(inputs, 5);

    // Year 5: (100,000 × 1.03^5) - (60,000 × 1.03^5)
    // = (100,000 × 1.159274) - (60,000 × 1.159274)
    // = 115,927.4 - 69,556.44 = 46,370.96
    expect(result).toBeCloseTo(46370.96, 2);
  });

  it("should return -1 when annualIncome is null", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: null,
        annualExpenses: 60000,
      },
    };

    const result = calculateYearlyContribution(inputs, 1);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Cannot calculate yearly contribution: annual income and expenses are required"
    );
    expect(result).toBe(-1);
    consoleSpy.mockRestore();
  });

  it("should return -1 when annualExpenses is null", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 100000,
        annualExpenses: null,
      },
    };

    const result = calculateYearlyContribution(inputs, 1);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Cannot calculate yearly contribution: annual income and expenses are required"
    );
    expect(result).toBe(-1);
    consoleSpy.mockRestore();
  });

  it("should handle negative contribution (expenses exceed income)", () => {
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        annualIncome: 50000,
        annualExpenses: 60000, // Spending more than earning
      },
      growthRates: {
        incomeGrowthRate: 2,
        expenseGrowthRate: 4, // Expenses growing faster
      },
    };

    const result0 = calculateYearlyContribution(inputs, 0);
    const result1 = calculateYearlyContribution(inputs, 1);

    // Year 0: 50,000 - 60,000 = -10,000
    expect(result0).toBe(-10000);

    // Year 1: (50,000 × 1.02) - (60,000 × 1.04) = 51,000 - 62,400 = -11,400
    expect(result1).toBe(-11400);
  });
});
