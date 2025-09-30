import { z } from 'zod';

import type { ColumnFormat } from '@/lib/types/column-format';

// Multi Simulation Table Schema
export const multiSimulationTableRowSchema = z.object({
  seed: z.number(),
  success: z.boolean(),
  retirementAge: z.number().nullable(),
  bankruptcyAge: z.number().nullable(),
  finalPhaseName: z.string().nullable(),
  finalPortfolioValue: z.number(),
  averageStockReturn: z.number().nullable(),
  averageBondReturn: z.number().nullable(),
  averageCashReturn: z.number().nullable(),
  averageInflationRate: z.number().nullable(),
  lifetimeIncomeTaxes: z.number().nullable(),
  lifetimeCapGainsTaxes: z.number().nullable(),
  lifetimeTaxes: z.number().nullable(),
  lifetimeContributions: z.number().nullable(),
  lifetimeWithdrawals: z.number().nullable(),
  lifetimeRealizedGains: z.number().nullable(),
  historicalRanges: z.array(z.object({ startYear: z.number(), endYear: z.number() })).nullable(),
});

export type MultiSimulationTableRow = z.infer<typeof multiSimulationTableRowSchema>;

const MULTI_SIMULATION_COLUMNS = {
  seed: { title: 'Seed', format: 'number' },
  success: { title: 'Success', format: 'string' },
  retirementAge: { title: 'Retirement Age', format: 'number' },
  bankruptcyAge: { title: 'Bankruptcy Age', format: 'number' },
  finalPhaseName: { title: 'Final Phase', format: 'string' },
  finalPortfolioValue: { title: 'Final Portfolio', format: 'currency' },
  averageStockReturn: { title: 'Mean Stock Return', format: 'percentage' },
  averageBondReturn: { title: 'Mean Bond Return', format: 'percentage' },
  averageCashReturn: { title: 'Mean Cash Return', format: 'percentage' },
  averageInflationRate: { title: 'Mean Inflation Rate', format: 'percentage' },
  lifetimeIncomeTaxes: { title: 'Lifetime Income Taxes', format: 'currency' },
  lifetimeCapGainsTaxes: { title: 'Lifetime Cap Gains Taxes', format: 'currency' },
  lifetimeTaxes: { title: 'Lifetime Taxes', format: 'currency' },
  lifetimeContributions: { title: 'Lifetime Contributions', format: 'currency' },
  lifetimeWithdrawals: { title: 'Lifetime Withdrawals', format: 'currency' },
  lifetimeRealizedGains: { title: 'Lifetime Realized Gains', format: 'currency' },
  historicalRanges: { title: 'Historical Ranges', format: 'historicalRanges' },
} as const;

export const MULTI_SIMULATION_TABLE_CONFIG: Record<keyof MultiSimulationTableRow, { title: string; format: ColumnFormat }> =
  MULTI_SIMULATION_COLUMNS;

// Yearly Aggregate Table Schema
export const yearlyAggregateTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),

  percentAccumulation: z.number(),
  percentRetirement: z.number(),
  percentBankrupt: z.number(),

  p10Portfolio: z.number(),
  p25Portfolio: z.number(),
  p50Portfolio: z.number(),
  p75Portfolio: z.number(),
  p90Portfolio: z.number(),
});

export type YearlyAggregateTableRow = z.infer<typeof yearlyAggregateTableRowSchema>;

const YEARLY_AGGREGATE_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  percentAccumulation: { title: '% Accumulation Phase', format: 'percentage' },
  percentRetirement: { title: '% Retirement Phase', format: 'percentage' },
  percentBankrupt: { title: '% Bankrupt', format: 'percentage' },
  p10Portfolio: { title: 'P10 Portfolio', format: 'currency' },
  p25Portfolio: { title: 'P25 Portfolio', format: 'currency' },
  p50Portfolio: { title: 'P50 Portfolio', format: 'currency' },
  p75Portfolio: { title: 'P75 Portfolio', format: 'currency' },
  p90Portfolio: { title: 'P90 Portfolio', format: 'currency' },
} as const;

export const YEARLY_AGGREGATE_TABLE_CONFIG: Record<keyof YearlyAggregateTableRow, { title: string; format: ColumnFormat }> =
  YEARLY_AGGREGATE_COLUMNS;
