/**
 * Simulation Table Schema - Data Structure and Presentation Metadata
 *
 * This module provides Zod schema definitions for simulation table data along with
 * co-located presentation metadata. It defines both the data structure and how
 * each field should be displayed in table format.
 *
 * Features:
 * - Runtime validation of simulation data
 * - Type-safe table column generation
 * - Co-located data and presentation logic
 * - Automatic formatter assignment based on field types
 */

import { z } from 'zod';

// Zod schema for simulation table row data
export const simulationTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string(),
  portfolioValue: z.number(),
  stocksValue: z.number(),
  stocksReturn: z.number().nullable(),
  bondsValue: z.number(),
  bondsReturn: z.number().nullable(),
  cashValue: z.number(),
  cashReturn: z.number().nullable(),
  inflationRate: z.number().nullable(),
});

// Infer TypeScript type from schema
export type SimulationTableRow = z.infer<typeof simulationTableRowSchema>;

// Format types for different data presentations
export type ColumnFormat = 'number' | 'currency' | 'percentage' | 'string' | 'historicalRanges';

// Define the structure with metadata
const SIMULATION_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  portfolioValue: { title: 'Portfolio Value', format: 'currency' },
  stocksValue: { title: 'Stocks Value', format: 'currency' },
  stocksReturn: { title: 'Stocks Return', format: 'percentage' },
  bondsValue: { title: 'Bonds Value', format: 'currency' },
  bondsReturn: { title: 'Bonds Return', format: 'percentage' },
  cashValue: { title: 'Cash Value', format: 'currency' },
  cashReturn: { title: 'Cash Return', format: 'percentage' },
  inflationRate: { title: 'Inflation Rate', format: 'percentage' },
} as const;

// Type-safe config that ensures all keys match SimulationTableRow
export const SIMULATION_TABLE_CONFIG: Record<keyof SimulationTableRow, { title: string; format: ColumnFormat }> = SIMULATION_COLUMNS;

// Helper to validate simulation data at runtime
export const validateSimulationTableRow = (data: unknown): SimulationTableRow => {
  return simulationTableRowSchema.parse(data);
};

// Helper to validate array of simulation data
export const validateSimulationTableData = (data: unknown[]): SimulationTableRow[] => {
  return data.map(validateSimulationTableRow);
};

// Zod schema for Stochastic simulation table row data
export const stochasticTableRowSchema = z.object({
  seed: z.number(),
  success: z.boolean(),
  fireAge: z.number().nullable(),
  bankruptcyAge: z.number().nullable(),
  finalPhaseName: z.string(),
  finalPortfolioValue: z.number(),
  averageStocksReturn: z.number().nullable(),
  averageBondsReturn: z.number().nullable(),
  averageCashReturn: z.number().nullable(),
  averageInflationRate: z.number().nullable(),
  historicalRanges: z.array(z.object({ startYear: z.number(), endYear: z.number() })).nullable(), // Raw range data
});

// Infer TypeScript type from Stochastic schema
export type StochasticTableRow = z.infer<typeof stochasticTableRowSchema>;

// Define the Stochastic columns structure with metadata
const STOCHASTIC_COLUMNS = {
  seed: { title: 'Seed', format: 'number' },
  success: { title: 'Success', format: 'string' },
  fireAge: { title: 'FIRE Age', format: 'number' },
  bankruptcyAge: { title: 'Bankruptcy Age', format: 'number' },
  finalPhaseName: { title: 'Final Phase', format: 'string' },
  finalPortfolioValue: { title: 'Final Portfolio', format: 'currency' },
  averageStocksReturn: { title: 'Mean Stocks Return', format: 'percentage' },
  averageBondsReturn: { title: 'Mean Bonds Return', format: 'percentage' },
  averageCashReturn: { title: 'Mean Cash Return', format: 'percentage' },
  averageInflationRate: { title: 'Mean Inflation Rate', format: 'percentage' },
  historicalRanges: { title: 'Historical Ranges', format: 'historicalRanges' },
} as const;

// Type-safe config for Stochastic table
export const STOCHASTIC_TABLE_CONFIG: Record<keyof StochasticTableRow, { title: string; format: ColumnFormat }> = STOCHASTIC_COLUMNS;

// Helper to validate Stochastic data at runtime
export const validateStochasticTableRow = (data: unknown): StochasticTableRow => {
  return stochasticTableRowSchema.parse(data);
};

// Helper to validate array of Stochastic data
export const validateStochasticTableData = (data: unknown[]): StochasticTableRow[] => {
  return data.map(validateStochasticTableRow);
};

// Yearly aggregate table schema
export const yearlyAggregateTableRowSchema = z.object({
  // Time identifiers
  year: z.number(),
  age: z.number(),

  // Success metrics
  percentAccumulation: z.number(), // 0-100
  percentRetirement: z.number(), // 0-100
  percentBankrupt: z.number(), // 0-100

  // Portfolio percentiles
  p10Portfolio: z.number(),
  p25Portfolio: z.number(),
  p50Portfolio: z.number(),
  p75Portfolio: z.number(),
  p90Portfolio: z.number(),

  // Additional statistics
  minPortfolio: z.number().nullable(),
  maxPortfolio: z.number().nullable(),
});

// Infer TypeScript type from schema
export type YearlyAggregateTableRow = z.infer<typeof yearlyAggregateTableRowSchema>;

// Define the columns structure with metadata
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
  minPortfolio: { title: 'Min Portfolio', format: 'currency' },
  maxPortfolio: { title: 'Max Portfolio', format: 'currency' },
} as const;

// Type-safe config for Yearly Aggregate table
export const YEARLY_AGGREGATE_TABLE_CONFIG: Record<keyof YearlyAggregateTableRow, { title: string; format: ColumnFormat }> =
  YEARLY_AGGREGATE_COLUMNS;

// Helper to validate yearly aggregate data at runtime
export const validateYearlyAggregateTableRow = (data: unknown): YearlyAggregateTableRow => {
  return yearlyAggregateTableRowSchema.parse(data);
};

// Helper to validate array of yearly aggregate data
export const validateYearlyAggregateTableData = (data: unknown[]): YearlyAggregateTableRow[] => {
  return data.map(validateYearlyAggregateTableRow);
};
