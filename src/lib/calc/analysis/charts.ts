import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { calculateFuturePortfolioValue } from '../core/projections';

export interface ChartDataPoint {
  age: number;
  portfolioValue: number;
}

export const getFIREChartData = (inputs: QuickPlanInputs, calculateInNominalTerms: boolean): ChartDataPoint[] => {
  const startAge = inputs.basics.currentAge;
  if (startAge === null) return [];

  const endAge = inputs.retirementFunding.lifeExpectancy;

  const data: ChartDataPoint[] = [];
  for (let age = startAge; age <= endAge; age++) {
    const portfolioValue = calculateFuturePortfolioValue(inputs, age - startAge, calculateInNominalTerms);

    if (portfolioValue !== null) {
      data.push({ age, portfolioValue });
    }
  }

  return data;
};
