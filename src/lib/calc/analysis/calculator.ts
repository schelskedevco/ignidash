import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { calculateRequiredPortfolio, calculateFuturePortfolioValue } from '../core/projections';

/**
 * Calculate the number of years until FIRE (Financial Independence, Retire Early)
 * Returns -1 if FIRE is not achievable within 100 years or if required data is missing
 */
// CAN BE DERIVED FROM OTHER SIMULATION ENGINE DATA
export const calculateYearsToFIRE = (inputs: QuickPlanInputs): number | null => {
  const requiredPortfolio = calculateRequiredPortfolio(
    inputs.goals.retirementExpenses,
    inputs.retirementFunding.safeWithdrawalRate,
    inputs.retirementFunding.effectiveTaxRate
  );
  if (requiredPortfolio === null) {
    console.warn('Cannot calculate years to FIRE: required portfolio is missing');
    return null;
  }

  const currentPortfolioValue = inputs.basics.investedAssets;
  if (currentPortfolioValue === null) {
    console.warn('Cannot calculate years to FIRE: current portfolio value is required');
    return null;
  }

  if (currentPortfolioValue >= requiredPortfolio) {
    return 0; // Already achieved FIRE
  }

  // Binary search for the years to FIRE
  let low = 0.0;
  let high = 100.0;
  let result = null;

  // First check if it's even possible within 100 years
  const maxValue = calculateFuturePortfolioValue(inputs, high);
  if (maxValue === null || maxValue < requiredPortfolio) {
    return null; // Cannot retire within 100 years
  }

  while (high - low > 0.005) {
    const mid = (low + high) / 2;
    const futureValue = calculateFuturePortfolioValue(inputs, mid);

    if (futureValue === null) {
      return null; // Error in calculation
    }

    if (futureValue >= requiredPortfolio) {
      result = mid;
      high = mid;
    } else {
      low = mid;
    }
  }

  // Round to nearest tenth
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
// SIMULATION RESULT FOR DISPLAY
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
  const requiredPortfolio = calculateRequiredPortfolio(
    inputs.goals.retirementExpenses,
    inputs.retirementFunding.safeWithdrawalRate,
    inputs.retirementFunding.effectiveTaxRate
  );

  return {
    isAchievable: fireAge !== null && yearsToFIRE !== null && requiredPortfolio !== null,
    fireAge,
    yearsToFIRE,
    requiredPortfolio,
  };
};
