import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { calculateWeightedPortfolioReturnReal } from './returns';
import { calculateYearlyContribution, calculateRetirementCashFlow } from './contributions';

// Calculation function to determine required portfolio for retirement
export const calculateRequiredPortfolio = (retirementExpenses: number | null, safeWithdrawalRate: number): number | null => {
  if (retirementExpenses === null) {
    console.warn('Cannot calculate required portfolio: retirement expenses is required');
    return null;
  }

  return retirementExpenses / (safeWithdrawalRate / 100);
};

// Calculate future portfolio value with annual contributions
export const calculateFuturePortfolioValue = (inputs: QuickPlanInputs, years: number): number | null => {
  const { investedAssets } = inputs.basics;
  if (investedAssets === null) {
    console.warn('Cannot calculate future portfolio value: invested assets is required');
    return null;
  }

  // Get return rate as decimal
  const rateOfReturn = calculateWeightedPortfolioReturnReal(inputs.allocation, inputs.marketAssumptions) / 100;

  let portfolioValue = investedAssets;

  // Handle full years
  const fullYears = Math.floor(years);
  for (let year = 0; year < fullYears; year++) {
    const contribution = calculateYearlyContribution(inputs, year);

    // Handle error case from calculateYearlyContribution
    if (contribution === null) {
      console.warn(`Failed to calculate contribution for year ${year}`);
      return null;
    }

    // Portfolio grows for the year (only if positive)
    if (portfolioValue > 0) {
      portfolioValue *= 1 + rateOfReturn;
    }

    // Add contribution at end of year
    portfolioValue += contribution;
  }

  // Handle partial year if present
  const partialYear = years - fullYears;
  if (partialYear > 0) {
    const partialYearContribution = calculateYearlyContribution(inputs, fullYears);

    // Handle error case from calculateYearlyContribution
    if (partialYearContribution === null) {
      console.warn(`Failed to calculate contribution for partial year ${fullYears}`);
      return null;
    }

    // Portfolio grows for the partial year (only if positive)
    if (portfolioValue > 0) {
      portfolioValue *= Math.pow(1 + rateOfReturn, partialYear);
    }

    // Add prorated contribution at end of partial year
    const proratedContribution = partialYearContribution * partialYear;
    portfolioValue += proratedContribution;
  }

  return portfolioValue;
};

// Calculate portfolio value after FIRE age with retirement withdrawals
export const calculateFuturePortfolioValueAfterRetirement = (
  inputs: QuickPlanInputs,
  startingPortfolioValue: number,
  yearsInRetirement: number,
  retirementStartAge: number
): number | null => {
  const { retirementExpenses } = inputs.goals;
  if (retirementExpenses === null) {
    console.warn('Cannot calculate post-FIRE portfolio value: retirement expenses is required');
    return null;
  }

  const { retirementIncome, effectiveTaxRate } = inputs.retirementFunding;

  // Get return rate as decimal
  const rateOfReturn = calculateWeightedPortfolioReturnReal(inputs.allocation, inputs.marketAssumptions) / 100;

  let portfolioValue = startingPortfolioValue;

  // Handle full years
  const fullYears = Math.floor(yearsInRetirement);
  for (let year = 0; year < fullYears; year++) {
    // Calculate cash flows for this year
    const currentAge = retirementStartAge + year;
    const { grossWithdrawal, surplus } = calculateRetirementCashFlow(retirementExpenses, retirementIncome, effectiveTaxRate, currentAge);

    // Beginning-of-year withdrawal
    portfolioValue -= grossWithdrawal;

    // Portfolio grows for the rest of the year (only if positive)
    if (portfolioValue > 0) {
      portfolioValue *= 1 + rateOfReturn;
    }

    // If passive income exceeds expenses, add surplus as end-of-year contribution
    if (surplus > 0) {
      portfolioValue += surplus;
    }
  }

  // Handle partial year if present
  const partialYear = yearsInRetirement - fullYears;
  if (partialYear > 0) {
    // Calculate cash flows for partial year
    const currentAge = retirementStartAge + fullYears;
    const { grossWithdrawal, surplus } = calculateRetirementCashFlow(retirementExpenses, retirementIncome, effectiveTaxRate, currentAge);

    // Prorate withdrawal for partial year (beginning of period)
    const proratedWithdrawal = grossWithdrawal * partialYear;
    portfolioValue -= proratedWithdrawal;

    // Portfolio grows for the partial year (only if positive)
    if (portfolioValue > 0) {
      portfolioValue *= Math.pow(1 + rateOfReturn, partialYear);
    }

    // If passive income exceeds expenses, add prorated surplus as end-of-period contribution
    if (surplus > 0) {
      portfolioValue += surplus * partialYear;
    }
  }

  return portfolioValue;
};
