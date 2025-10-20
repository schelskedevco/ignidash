export interface KeyMetrics {
  success: number;
  startAge: number;
  retirementAge: number | null;
  yearsToRetirement: number | null;
  bankruptcyAge: number | null;
  yearsToBankruptcy: number | null;
  portfolioAtRetirement: number | null;
  finalPortfolio: number;
  progressToRetirement: number | null;
}
