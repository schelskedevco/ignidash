/**
 * Summary metrics extracted from simulation results.
 *
 * Provides at-a-glance indicators (success rate, retirement/bankruptcy ages,
 * portfolio values) for both single and multi-simulation runs.
 */

export interface KeyMetricsBase {
  success: number;
  retirementAge: number | null;
  yearsToRetirement: number | null;
  bankruptcyAge: number | null;
  yearsToBankruptcy: number | null;
  portfolioAtRetirement: number | null;
  lifetimeTaxesAndPenalties: number;
  finalPortfolio: number;
  progressToRetirement: number | null;
}

export interface SingleSimulationKeyMetrics extends KeyMetricsBase {
  type: 'single';
}

export interface MultiSimulationKeyMetrics extends KeyMetricsBase {
  type: 'multi';
  chanceOfRetirement: number;
  chanceOfBankruptcy: number;
  minRetirementAge: number | null;
  maxRetirementAge: number | null;
  minBankruptcyAge: number | null;
  maxBankruptcyAge: number | null;
}

export type KeyMetrics = SingleSimulationKeyMetrics | MultiSimulationKeyMetrics;
