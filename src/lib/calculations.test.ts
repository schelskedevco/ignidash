import { describe, it, expect, vi } from "vitest";
import {
  calculateRequiredPortfolio,
  calculateWeightedPortfolioReturnNominal,
  calculateWeightedPortfolioReturnReal,
  calculateYearlyContribution,
  calculateFuturePortfolioValue,
} from "./calculations";
import { defaultState } from "./stores/quick-plan-store";

describe("calculateRequiredPortfolio", () => {
  it("should return 1,000,000 for 40,000 retirement expenses with 4% SWR", () => {
    const result = calculateRequiredPortfolio(40000, 4);
    expect(result).toBe(1000000);
  });

  it("should warn and return -1 when retirementExpenses is null", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = calculateRequiredPortfolio(null, 4);

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

    const result = calculateWeightedPortfolioReturnNominal(
      inputs.allocation,
      inputs.marketAssumptions
    );

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
    expect(
      calculateWeightedPortfolioReturnNominal(
        inputs.allocation,
        inputs.marketAssumptions
      )
    ).toBe(10);
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

    calculateWeightedPortfolioReturnNominal(
      inputs.allocation,
      inputs.marketAssumptions
    );
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

    const result = calculateWeightedPortfolioReturnReal(inputs);

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

    const nominalReturn = calculateWeightedPortfolioReturnNominal(
      inputs.allocation,
      inputs.marketAssumptions
    );
    const realReturn = calculateWeightedPortfolioReturnReal(inputs);

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

    const result = calculateWeightedPortfolioReturnReal(inputs);

    // Expected calculation:
    // Nominal return: 3%
    // Real return: (1.03 / 1.05) - 1 = -0.01904... = -1.904...%
    expect(result).toBeCloseTo(-1.905, 2);
  });
});

describe("calculateYearlyContribution", () => {
  it("should calculate correct contribution for year 0 (base year) with nominal values", () => {
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

    const result = calculateYearlyContribution(inputs, 0, true); // true for nominal

    // Year 0: 100,000 - 60,000 = 40,000
    expect(result).toBe(40000);
  });

  it("should calculate correct contribution for year 1 with nominal values", () => {
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

    const result = calculateYearlyContribution(inputs, 1, true); // true for nominal

    // Year 1: (100,000 × 1.03) - (60,000 × 1.03) = 103,000 - 61,800 = 41,200
    expect(result).toBe(41200);
  });

  it("should calculate correct contribution for year 1 with real values", () => {
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

    const result = calculateYearlyContribution(inputs, 1, false); // false for real

    // Real growth = (1.05 / 1.03) - 1 = 0.0194 = 1.94%
    // Year 1: (100,000 × 1.0194) - (60,000 × 1.0194) = 101,940 - 61,164 = 40,776
    expect(result).toBeCloseTo(40776.7, 1);
  });

  it("should handle different growth rates for income and expenses with nominal values", () => {
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

    const result = calculateYearlyContribution(inputs, 1, true); // true for nominal

    // Year 1: (100,000 × 1.05) - (60,000 × 1.02) = 105,000 - 61,200 = 43,800
    expect(result).toBe(43800);
  });

  it("should handle multiple years with compounding using nominal values", () => {
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

    const result = calculateYearlyContribution(inputs, 5, true); // true for nominal

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

    const result = calculateYearlyContribution(inputs, 1, true);

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

    const result = calculateYearlyContribution(inputs, 1, true);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Cannot calculate yearly contribution: annual income and expenses are required"
    );
    expect(result).toBe(-1);
    consoleSpy.mockRestore();
  });

  it("should handle negative contribution (expenses exceed income) with nominal values", () => {
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

    const result0 = calculateYearlyContribution(inputs, 0, true);
    const result1 = calculateYearlyContribution(inputs, 1, true);

    // Year 0: 50,000 - 60,000 = -10,000
    expect(result0).toBe(-10000);

    // Year 1: (50,000 × 1.02) - (60,000 × 1.04) = 51,000 - 62,400 = -11,400
    expect(result1).toBe(-11400);
  });
});

describe("calculateFuturePortfolioValue", () => {
  it("should calculate correct future value with positive real returns and contributions", () => {
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

    const result = calculateFuturePortfolioValue(inputs, 5, false); // false for real values

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

  it("should calculate correct future value with nominal returns", () => {
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
        incomeGrowthRate: 3,
        expenseGrowthRate: 3,
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 5, true); // true for nominal values

    // Nominal return: 8.5%
    // Initial assets after 5 years: 100,000 × (1.085)^5 = 150,365.67
    //
    // Contributions growing at 3% nominal:
    // Year 0: 30,000 × (1.085)^4 = 41,575.76
    // Year 1: 30,900 × (1.085)^3 = 39,468.23
    // Year 2: 31,827 × (1.085)^2 = 37,467.54
    // Year 3: 32,781.81 × (1.085)^1 = 35,568.26
    // Year 4: 33,765.26 × (1.085)^0 = 33,765.26
    // Total contributions FV: 187,845.06
    //
    // Total: 150,365.67 + 187,845.06 = 338,210.73

    expect(result).toBeCloseTo(338210.73, 0);
  });

  it("should handle zero real return scenario (100% cash with inflation = cash return)", () => {
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

    const result = calculateFuturePortfolioValue(inputs, 5, false); // false for real values

    // With 0% real return and 0% real growth on contributions
    // Initial assets: 100,000 (no real growth)
    // Contributions: 30,000 per year × 5 years = 150,000
    // Total: 100,000 + 150,000 = 250,000

    expect(result).toBe(250000);
  });

  it("should handle negative contributions in later years when expenses grow faster than income", () => {
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

    const result = calculateFuturePortfolioValue(inputs, 10, false); // false for real values

    // Real return: (1.07 / 1.03) - 1 = 3.883%
    // Real income growth: (1.01 / 1.03) - 1 = -1.94%
    // Real expense growth: (1.04 / 1.03) - 1 = 0.97%
    //
    // Contributions turn negative as expenses grow faster than income in real terms
    // Assets should grow but be reduced by negative contributions (withdrawals)

    expect(result).toBeGreaterThan(500000); // Should still grow due to returns
    expect(result).toBeLessThan(800000); // But limited by withdrawals
  });

  it("should return -1 when investedAssets is null", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: null,
        annualIncome: 80000,
        annualExpenses: 50000,
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 5, false);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Cannot calculate future portfolio value: invested assets is required"
    );
    expect(result).toBe(-1);
    consoleSpy.mockRestore();
  });

  it("should return -1 when calculateYearlyContribution returns -1", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const inputs = {
      ...defaultState.inputs,
      basics: {
        ...defaultState.inputs.basics,
        investedAssets: 100000,
        annualIncome: null, // This will cause calculateYearlyContribution to return -1
        annualExpenses: 50000,
      },
    };

    const result = calculateFuturePortfolioValue(inputs, 5, false);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Cannot calculate yearly contribution: annual income and expenses are required"
    );
    expect(result).toBe(-1);
    consoleSpy.mockRestore();
  });
});
