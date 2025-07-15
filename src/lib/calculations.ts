import {
  AllocationInputs,
  MarketAssumptionsInputs,
  GrowthRatesInputs,
  BasicsInputs,
} from "./schemas/quick-plan-schema";

// Calculation function to determine required portfolio for retirement
export const calculateRequiredPortfolio = (
  retirementExpenses: number | null,
  safeWithdrawalRate: number
): number => {
  if (retirementExpenses === null) {
    console.warn(
      "Cannot calculate required portfolio: retirement expenses is required"
    );
    return -1;
  }

  return retirementExpenses / (safeWithdrawalRate / 100);
};

// Helper function to calculate nominal portfolio return
export const calculateWeightedPortfolioReturnNominal = (
  allocation: AllocationInputs,
  marketAssumptions: MarketAssumptionsInputs
): number => {
  const { stockAllocation, bondAllocation, cashAllocation } = allocation;
  const { stockReturn, bondReturn, cashReturn } = marketAssumptions;

  // Validate allocations sum to 100%
  const totalAllocation = stockAllocation + bondAllocation + cashAllocation;
  if (Math.abs(totalAllocation - 100) > 0.01) {
    console.warn(`Allocations sum to ${totalAllocation}%, not 100%`);
  }

  // Convert percentages to decimals
  const stockWeight = stockAllocation / 100;
  const bondWeight = bondAllocation / 100;
  const cashWeight = cashAllocation / 100;

  const stockReturnDecimal = stockReturn / 100;
  const bondReturnDecimal = bondReturn / 100;
  const cashReturnDecimal = cashReturn / 100;

  return (
    (stockWeight * stockReturnDecimal +
      bondWeight * bondReturnDecimal +
      cashWeight * cashReturnDecimal) *
    100
  );
};

// Helper function to calculate real portfolio return
export const calculateWeightedPortfolioReturnReal = (
  allocation: AllocationInputs,
  marketAssumptions: MarketAssumptionsInputs
): number => {
  const { inflationRate } = marketAssumptions;

  // Get nominal return using the nominal function
  const nominalReturn = calculateWeightedPortfolioReturnNominal(
    allocation,
    marketAssumptions
  );

  // Calculate real return (adjust for inflation)
  const realReturn = (1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1;

  return realReturn * 100;
};

// Helper function to calculate yearly contribution (income - expenses) for a given year
export const calculateYearlyContribution = (
  annualIncome: number | null,
  annualExpenses: number | null,
  growthRates: GrowthRatesInputs,
  inflationRate: number,
  year: number,
  calculateInNominalTerms: boolean
): number => {
  if (annualIncome === null || annualExpenses === null) {
    console.warn(
      "Cannot calculate yearly contribution: annual income and expenses are required"
    );
    return -1;
  }

  const { incomeGrowthRate, expenseGrowthRate } = growthRates;

  let effectiveIncomeGrowth: number;
  let effectiveExpenseGrowth: number;

  if (calculateInNominalTerms) {
    // Use the rates as-is (they're already nominal)
    effectiveIncomeGrowth = incomeGrowthRate / 100;
    effectiveExpenseGrowth = expenseGrowthRate / 100;
  } else {
    // Convert nominal rates to real rates
    // Real growth = (1 + nominal) / (1 + inflation) - 1
    effectiveIncomeGrowth =
      (1 + incomeGrowthRate / 100) / (1 + inflationRate / 100) - 1;
    effectiveExpenseGrowth =
      (1 + expenseGrowthRate / 100) / (1 + inflationRate / 100) - 1;
  }

  // Calculate future values using the appropriate growth rates
  const futureIncome = annualIncome * Math.pow(1 + effectiveIncomeGrowth, year);
  const futureExpenses =
    annualExpenses * Math.pow(1 + effectiveExpenseGrowth, year);

  return futureIncome - futureExpenses;
};

// Calculate future portfolio value with annual contributions
export const calculateFuturePortfolioValue = (
  basics: BasicsInputs,
  allocation: AllocationInputs,
  marketAssumptions: MarketAssumptionsInputs,
  growthRates: GrowthRatesInputs,
  years: number,
  calculateInNominalTerms: boolean
): number => {
  const { investedAssets } = basics;
  if (investedAssets === null) {
    console.warn(
      "Cannot calculate future portfolio value: invested assets is required"
    );
    return -1;
  }

  // Get return rate as decimal
  const rateOfReturn =
    (calculateInNominalTerms
      ? calculateWeightedPortfolioReturnNominal(allocation, marketAssumptions)
      : calculateWeightedPortfolioReturnReal(allocation, marketAssumptions)) /
    100;

  // Current assets grow for the full period
  const futureValueOfAssets =
    investedAssets * Math.pow(1 + rateOfReturn, years);

  // Calculate future value of all contributions
  let futureValueOfContributions = 0;

  for (let year = 0; year < years; year++) {
    const contribution = calculateYearlyContribution(
      basics.annualIncome,
      basics.annualExpenses,
      growthRates,
      marketAssumptions.inflationRate,
      year,
      calculateInNominalTerms
    );

    // Handle error case from calculateYearlyContribution
    if (contribution === -1) {
      console.warn(`Failed to calculate contribution for year ${year}`);
      return -1;
    }

    // Contribution made at end of year, so it grows for (years - year - 1) periods
    // For year 0: grows for (years - 1) periods
    // For year (years - 1): grows for 0 periods (no growth)
    const growthPeriods = years - year - 1;

    // Calculate future value of this year's contribution
    // When growthPeriods = 0, Math.pow returns 1, so contribution is added as-is
    futureValueOfContributions +=
      contribution * Math.pow(1 + rateOfReturn, growthPeriods);
  }

  return futureValueOfAssets + futureValueOfContributions;
};
