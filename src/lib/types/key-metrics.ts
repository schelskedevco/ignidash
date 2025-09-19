export interface SingleSimulationKeyMetrics {
  success: boolean;
  startAge: number;
  retirementAge: number | null;
  yearsToRetirement: number | null;
  portfolioAtRetirement: number | null;
  finalPortfolio: number;
  progressToRetirement: number | null;
}
