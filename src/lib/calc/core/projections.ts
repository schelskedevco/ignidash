import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { calculateWeightedPortfolioReturnReal } from './returns';
import { calculateYearlyContribution } from './contributions';

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

  // Current assets grow for the full period
  const futureValueOfAssets = investedAssets * Math.pow(1 + rateOfReturn, years);

  // Calculate future value of all contributions
  let futureValueOfContributions = 0;

  // Handle full years
  const fullYears = Math.floor(years);
  for (let year = 0; year < fullYears; year++) {
    const contribution = calculateYearlyContribution(inputs, year);

    // Handle error case from calculateYearlyContribution
    if (contribution === null) {
      console.warn(`Failed to calculate contribution for year ${year}`);
      return null;
    }

    // Contribution made at end of year, so it grows for (years - year - 1) periods
    const growthPeriods = years - year - 1;
    futureValueOfContributions += contribution * Math.pow(1 + rateOfReturn, growthPeriods);
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

    // For partial year, contribution is prorated and made at the end of the partial period
    // So it has no growth period (added at the very end)
    const proratedContribution = partialYearContribution * partialYear;
    futureValueOfContributions += proratedContribution;
  }

  return futureValueOfAssets + futureValueOfContributions;
};

// Helper function to calculate retirement withdrawal and surplus for a given age
const calculateRetirementCashFlow = (
  retirementExpenses: number,
  retirementIncome: number,
  effectiveTaxRate: number,
  currentAge: number
): { grossWithdrawal: number; surplus: number } => {
  // Only apply retirement income if age 62 or older
  const applicableRetirementIncome = currentAge >= 62 ? retirementIncome : 0;

  // Calculate net passive income (after taxes)
  const netPassiveIncome = applicableRetirementIncome * (1 - effectiveTaxRate / 100);

  // Calculate after-tax shortfall that needs to be covered by withdrawals
  const afterTaxShortfall = retirementExpenses - netPassiveIncome;

  // If passive income covers all expenses, no withdrawal needed
  let grossWithdrawal = 0;
  let surplus = 0;

  if (afterTaxShortfall > 0) {
    // Calculate gross withdrawal needed (includes taxes on the withdrawal)
    grossWithdrawal = afterTaxShortfall / (1 - effectiveTaxRate / 100);
  } else {
    // Passive income exceeds expenses, calculate surplus
    surplus = Math.abs(afterTaxShortfall);
  }

  return { grossWithdrawal, surplus };
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
    // Calculate current age
    const currentAge = retirementStartAge + year;

    // Calculate cash flows for this year
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
    // Calculate current age for partial year
    const currentAge = retirementStartAge + fullYears;

    // Calculate cash flows for partial year
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
