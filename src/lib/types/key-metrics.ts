export interface SingleSimulationKeyMetrics {
  success: number;
  startAge: number;
  retirementAge: number | null;
  yearsToRetirement: number | null;
  portfolioAtRetirement: number | null;
  finalPortfolio: number;
  progressToRetirement: number | null;
}
