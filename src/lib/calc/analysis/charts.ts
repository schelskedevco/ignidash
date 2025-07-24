import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { calculateFuturePortfolioValue, calculateFuturePortfolioValueAfterRetirement } from '../core/projections';

export interface ChartDataPoint {
  age: number;
  portfolioValue: number;
}

// SIMULATION ENGINE ACROSS AGES FOR FIRE CHART
// CHANGES LIFE PHASE BASED ON PORTFOLIO VALUE AND FIRE AGE
export const getFIREChartData = (inputs: QuickPlanInputs, fireAge: number | null): ChartDataPoint[] => {
  const startAge = inputs.basics.currentAge;
  if (startAge === null) return [];

  const endAge = inputs.retirementFunding.lifeExpectancy;

  // Create a set of ages to include in the chart
  const agesToInclude = new Set<number>();

  // Add integer ages from start to end
  for (let age = startAge; age <= endAge; age++) {
    agesToInclude.add(age);
  }

  // Add the exact FIRE age if it exists and falls within our range
  if (fireAge !== null && fireAge >= startAge && fireAge <= endAge) {
    agesToInclude.add(fireAge);
  }

  // Convert to sorted array and generate data points
  const sortedAges = Array.from(agesToInclude).sort((a, b) => a - b);
  const data: ChartDataPoint[] = [];

  // Calculate portfolio value at FIRE once, if needed
  const portfolioValueAtFIRE = fireAge !== null ? calculateFuturePortfolioValue(inputs, fireAge - startAge) : null;

  for (const age of sortedAges) {
    const portfolioValue =
      fireAge !== null && age >= fireAge && portfolioValueAtFIRE !== null
        ? calculateFuturePortfolioValueAfterRetirement(inputs, portfolioValueAtFIRE, age - fireAge, fireAge)
        : calculateFuturePortfolioValue(inputs, age - startAge);

    if (portfolioValue !== null) {
      data.push({ age, portfolioValue });
    }
  }

  return data;
};
