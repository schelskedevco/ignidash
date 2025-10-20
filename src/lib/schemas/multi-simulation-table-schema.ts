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
  minStockReturn: z.number().nullable(),
  maxStockReturn: z.number().nullable(),
  meanStockReturn: z.number().nullable(),
  earlyRetirementStockReturn: z.number().nullable(),
  meanBondReturn: z.number().nullable(),
  meanCashReturn: z.number().nullable(),
  meanInflationRate: z.number().nullable(),
  lifetimeIncomeTaxes: z.number().nullable(),
  lifetimeCapGainsTaxes: z.number().nullable(),
  lifetimeEarlyWithdrawalPenalties: z.number().nullable(),
  lifetimeTaxesAndPenalties: z.number().nullable(),
  lifetimeContributions: z.number().nullable(),
  lifetimeWithdrawals: z.number().nullable(),
  lifetimeRealizedGains: z.number().nullable(),
  lifetimeRequiredMinimumDistributions: z.number().nullable(),
  historicalRanges: z.array(z.object({ startYear: z.number(), endYear: z.number() })).nullable(),
});

export type MultiSimulationTableRow = z.infer<typeof multiSimulationTableRowSchema>;

const MULTI_SIMULATION_COLUMNS = {
  seed: { title: 'Seed', format: 'number' },
  success: { title: 'Success', format: 'string' },
  retirementAge: { title: 'Retirement Age', format: 'number' },
  bankruptcyAge: { title: 'Bankruptcy Age', format: 'number' },
  finalPhaseName: { title: 'Final Phase', format: 'string' },
  finalPortfolioValue: { title: 'Final Portfolio Value', format: 'currency' },
  minStockReturn: { title: 'Min Stock Return', format: 'percentage' },
  maxStockReturn: { title: 'Max Stock Return', format: 'percentage' },
  meanStockReturn: { title: 'Mean Stock Return', format: 'percentage' },
  earlyRetirementStockReturn: { title: 'Mean Early Retirement Stock Return (SORR)', format: 'percentage' },
  meanBondReturn: { title: 'Mean Bond Return', format: 'percentage' },
  meanCashReturn: { title: 'Mean Cash Return', format: 'percentage' },
  meanInflationRate: { title: 'Mean Inflation Rate', format: 'percentage' },
  lifetimeIncomeTaxes: { title: 'Lifetime Income Taxes', format: 'currency' },
  lifetimeCapGainsTaxes: { title: 'Lifetime Cap Gains Taxes', format: 'currency' },
  lifetimeEarlyWithdrawalPenalties: { title: 'Lifetime Early Withdrawal Penalties', format: 'currency' },
  lifetimeTaxesAndPenalties: { title: 'Lifetime Taxes & Penalties', format: 'currency' },
  lifetimeContributions: { title: 'Lifetime Contributions', format: 'currency' },
  lifetimeWithdrawals: { title: 'Lifetime Withdrawals', format: 'currency' },
  lifetimeRealizedGains: { title: 'Lifetime Realized Gains', format: 'currency' },
  lifetimeRequiredMinimumDistributions: { title: 'Lifetime RMDs', format: 'currency' },
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

  p10PortfolioValue: z.number(),
  p25PortfolioValue: z.number(),
  p50PortfolioValue: z.number(),
  p75PortfolioValue: z.number(),
  p90PortfolioValue: z.number(),
});

export type YearlyAggregateTableRow = z.infer<typeof yearlyAggregateTableRowSchema>;

const YEARLY_AGGREGATE_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  percentAccumulation: { title: '% Accumulation Phase', format: 'percentage' },
  percentRetirement: { title: '% Retirement Phase', format: 'percentage' },
  percentBankrupt: { title: '% Bankrupt', format: 'percentage' },
  p10PortfolioValue: { title: 'P10 Portfolio Value', format: 'currency' },
  p25PortfolioValue: { title: 'P25 Portfolio Value', format: 'currency' },
  p50PortfolioValue: { title: 'P50 Portfolio Value', format: 'currency' },
  p75PortfolioValue: { title: 'P75 Portfolio Value', format: 'currency' },
  p90PortfolioValue: { title: 'P90 Portfolio Value', format: 'currency' },
} as const;

export const YEARLY_AGGREGATE_TABLE_CONFIG: Record<keyof YearlyAggregateTableRow, { title: string; format: ColumnFormat }> =
  YEARLY_AGGREGATE_COLUMNS;
