import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { calculateRequiredPortfolio, calculateFuturePortfolioValue } from '../core/projections';

/**
 * Calculate the number of years until FIRE (Financial Independence, Retire Early)
 * Returns -1 if FIRE is not achievable within 100 years or if required data is missing
 */
export const calculateYearsToFIRE = (inputs: QuickPlanInputs, maxYears: number = 100): number | null => {
  // First, check if we can calculate the required portfolio
  const requiredPortfolio = calculateRequiredPortfolio(inputs.goals.retirementExpenses, inputs.retirementFunding.safeWithdrawalRate);
  if (requiredPortfolio === null) {
    console.warn('Cannot calculate years to FIRE: required portfolio is missing');
    return null;
  }

  // Check if already FIRE'd
  const currentPortfolioValue = inputs.basics.investedAssets;
  if (currentPortfolioValue === null) {
    console.warn('Cannot calculate years to FIRE: current portfolio value is required');
    return null;
  }

  if (currentPortfolioValue >= requiredPortfolio) {
    return 0; // Already achieved FIRE
  }

  // Binary search for the years to FIRE
  let low = 0;
  let high = maxYears;
  let result = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const futureValue = calculateFuturePortfolioValue(inputs, mid, false); // Use real terms

    if (futureValue === null) {
      return null; // Error in calculation
    }

    if (futureValue >= requiredPortfolio) {
      result = mid;
      high = mid - 1; // Look for earlier years
    } else {
      low = mid + 1; // Need more years
    }
  }

  return result;
};

/**
 * Calculate the age at which someone can achieve FIRE
 * Returns -1 if FIRE is not achievable or if required data is missing
 */
export const calculateFIREAge = (inputs: QuickPlanInputs): number | null => {
  const { currentAge } = inputs.basics;
  if (currentAge === null) {
    console.warn('Cannot calculate FIRE age: current age is required');
    return null;
  }

  const yearsToFIRE = calculateYearsToFIRE(inputs);
  if (yearsToFIRE === null) {
    console.warn('Cannot calculate FIRE age: years to FIRE is required');
    return null;
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
  isAchievable: boolean;
  fireAge: number | null;
  yearsToFIRE: number | null;
  requiredPortfolio: number | null;
} => {
  const fireAge = calculateFIREAge(inputs);
  const yearsToFIRE = calculateYearsToFIRE(inputs);
  const requiredPortfolio = calculateRequiredPortfolio(inputs.goals.retirementExpenses, inputs.retirementFunding.safeWithdrawalRate);

  return {
    isAchievable: fireAge !== null && yearsToFIRE !== null && requiredPortfolio !== null,
    fireAge,
    yearsToFIRE,
    requiredPortfolio,
  };
};
