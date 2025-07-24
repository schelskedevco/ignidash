import { AllocationInputs, MarketAssumptionsInputs } from '@/lib/schemas/quick-plan-schema';

// WEIGHTED RETURNS FOR FIXED RETURNS SIMULATION ENGINE

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

  return (stockWeight * stockReturnDecimal + bondWeight * bondReturnDecimal + cashWeight * cashReturnDecimal) * 100;
};

// Helper function to calculate real portfolio return
export const calculateWeightedPortfolioReturnReal = (allocation: AllocationInputs, marketAssumptions: MarketAssumptionsInputs): number => {
  // Get nominal return using the nominal function
  const nominalReturn = calculateWeightedPortfolioReturnNominal(allocation, marketAssumptions);

  // Calculate real return (adjust for inflation)
  const realReturn = (1 + nominalReturn / 100) / (1 + marketAssumptions.inflationRate / 100) - 1;

  return realReturn * 100;
};
