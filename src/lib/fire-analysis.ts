import { QuickPlanInputs } from "./schemas/quick-plan-schema";
import {
  calculateRequiredPortfolio,
  calculateFuturePortfolioValue,
} from "./portfolio-calculations";

/**
 * Calculate the number of years until FIRE (Financial Independence, Retire Early)
 * Returns -1 if FIRE is not achievable within 100 years or if required data is missing
 */
export const calculateYearsToFIRE = (
  inputs: QuickPlanInputs,
  maxYears: number = 100
): number => {
  // First, check if we can calculate the required portfolio
  const requiredPortfolio = calculateRequiredPortfolio(
    inputs.goals.retirementExpenses,
    inputs.retirementFunding.safeWithdrawalRate
  );
  if (requiredPortfolio === -1) {
    return -1; // Missing required data
  }

  // Check if already FIRE'd
  const currentPortfolioValue = inputs.basics.investedAssets;
  if (currentPortfolioValue === null) {
    return -1; // Missing required data
  }

  if (currentPortfolioValue >= requiredPortfolio) {
    return 0; // Already achieved FIRE
  }

  // Binary search for the years to FIRE
  let low = 0;
  let high = maxYears;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const futureValue = calculateFuturePortfolioValue(
      inputs.basics,
      inputs.allocation,
      inputs.marketAssumptions,
      inputs.growthRates,
      mid,
      false
    ); // Use real terms

    if (futureValue === -1) {
      return -1; // Error in calculation
    }

    if (futureValue >= requiredPortfolio) {
      result = mid;
      high = mid - 1; // Look for earlier years
    } else {
      low = mid + 1; // Need more years
    }
  }

  // If no solution found within maxYears, check if it's achievable at all
  if (result === -1) {
    const finalValue = calculateFuturePortfolioValue(
      inputs.basics,
      inputs.allocation,
      inputs.marketAssumptions,
      inputs.growthRates,
      maxYears,
      false
    );
    if (finalValue < requiredPortfolio) {
      // Check if portfolio is growing - if the trajectory is positive,
      // it might be achievable beyond maxYears
      const valueAt90Years = calculateFuturePortfolioValue(
        inputs.basics,
        inputs.allocation,
        inputs.marketAssumptions,
        inputs.growthRates,
        maxYears - 10,
        false
      );
      if (finalValue > valueAt90Years) {
        return -1; // Growing but not fast enough within reasonable timeframe
      } else {
        return -1; // Portfolio is shrinking or not growing
      }
    }
  }

  return result;
};

/**
 * Calculate the age at which someone can achieve FIRE
 * Returns -1 if FIRE is not achievable or if required data is missing
 */
export const calculateFIREAge = (inputs: QuickPlanInputs): number => {
  const { currentAge } = inputs.basics;

  if (currentAge === null) {
    console.warn("Cannot calculate FIRE age: current age is required");
    return -1;
  }

  const yearsToFIRE = calculateYearsToFIRE(inputs);

  if (yearsToFIRE === -1) {
    return -1; // FIRE not achievable or missing data
  }

  return currentAge + yearsToFIRE;
};

/**
 * Get detailed FIRE calculation results
 * Provides more context about the FIRE calculation
 */
export const getFIREAnalysis = (
  inputs: QuickPlanInputs
): {
  achievable: boolean;
  yearsToFIRE: number;
  fireAge: number;
  requiredPortfolio: number;
  currentPortfolio: number;
  projectedPortfolioAtFIRE: number;
  message: string;
} => {
  const requiredPortfolio = calculateRequiredPortfolio(
    inputs.goals.retirementExpenses,
    inputs.retirementFunding.safeWithdrawalRate
  );
  const currentPortfolio = inputs.basics.investedAssets ?? 0;
  const yearsToFIRE = calculateYearsToFIRE(inputs);
  const fireAge = calculateFIREAge(inputs);

  // Handle missing data cases
  if (requiredPortfolio === -1 || yearsToFIRE === -1 || fireAge === -1) {
    const failureMessage =
      requiredPortfolio === -1
        ? "Missing required data to calculate FIRE goals"
        : "FIRE is not achievable with current parameters";

    return {
      achievable: false,
      yearsToFIRE: -1,
      fireAge: -1,
      requiredPortfolio: requiredPortfolio === -1 ? 0 : requiredPortfolio,
      currentPortfolio,
      projectedPortfolioAtFIRE: 0,
      message: failureMessage,
    };
  }

  const projectedPortfolioAtFIRE = calculateFuturePortfolioValue(
    inputs.basics,
    inputs.allocation,
    inputs.marketAssumptions,
    inputs.growthRates,
    yearsToFIRE,
    false
  );

  // Generate appropriate message
  let message = "";
  if (yearsToFIRE === 0) {
    message = "Congratulations! You have already achieved FIRE.";
  } else if (yearsToFIRE <= 10) {
    message = `You can achieve FIRE in ${yearsToFIRE} years at age ${fireAge}.`;
  } else if (yearsToFIRE <= 30) {
    message = `FIRE is achievable in ${yearsToFIRE} years at age ${fireAge}.`;
  } else {
    message = `FIRE is projected in ${yearsToFIRE} years at age ${fireAge}.`;
  }

  return {
    achievable: true,
    yearsToFIRE,
    fireAge,
    requiredPortfolio,
    currentPortfolio,
    projectedPortfolioAtFIRE,
    message,
  };
};

export interface ChartDataPoint {
  age: number;
  portfolioValue: number;
}

export const getFIREChartData = (
  inputs: QuickPlanInputs
): { age: number; portfolioValue: number }[] => {
  const startAge = inputs.basics.currentAge;
  const endAge = inputs.retirementFunding.lifeExpectancy;
  if (startAge === null) return [];

  const data: ChartDataPoint[] = [];
  for (let age = startAge; age <= endAge; age++) {
    const portfolioValue = calculateFuturePortfolioValue(
      inputs.basics,
      inputs.allocation,
      inputs.marketAssumptions,
      inputs.growthRates,
      age - startAge,
      false // Use real terms
    );

    if (portfolioValue !== -1) {
      data.push({ age, portfolioValue });
    }
  }

  return data;
};
