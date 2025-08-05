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

// Monte Carlo table schema
export const monteCarloTableRowSchema = z.object({
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
});

// Infer TypeScript type from Monte Carlo schema
export type MonteCarloTableRow = z.infer<typeof monteCarloTableRowSchema>;

// Define the Monte Carlo columns structure with metadata
const MONTE_CARLO_COLUMNS = {
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
} as const;

// Type-safe config for Monte Carlo table
export const MONTE_CARLO_TABLE_CONFIG: Record<keyof MonteCarloTableRow, { title: string; format: ColumnFormat }> = MONTE_CARLO_COLUMNS;

// Helper to validate Monte Carlo data at runtime
export const validateMonteCarloTableRow = (data: unknown): MonteCarloTableRow => {
  return monteCarloTableRowSchema.parse(data);
};

// Helper to validate array of Monte Carlo data
export const validateMonteCarloTableData = (data: unknown[]): MonteCarloTableRow[] => {
  return data.map(validateMonteCarloTableRow);
};

// Historical Backtest table schema (extends Monte Carlo with historical periods)
export const historicalBacktestTableRowSchema = z.object({
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
  historicalPeriods: z.array(z.object({ startYear: z.number(), endYear: z.number() })), // Raw range data
});

// Infer TypeScript type from Historical Backtest schema
export type HistoricalBacktestTableRow = z.infer<typeof historicalBacktestTableRowSchema>;

// Define the Historical Backtest columns structure with metadata
const HISTORICAL_BACKTEST_COLUMNS = {
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
  historicalPeriods: { title: 'Historical Periods', format: 'historicalRanges' },
} as const;

// Type-safe config for Historical Backtest table
export const HISTORICAL_BACKTEST_TABLE_CONFIG: Record<keyof HistoricalBacktestTableRow, { title: string; format: ColumnFormat }> =
  HISTORICAL_BACKTEST_COLUMNS;

// Helper to validate Historical Backtest data at runtime
export const validateHistoricalBacktestTableRow = (data: unknown): HistoricalBacktestTableRow => {
  return historicalBacktestTableRowSchema.parse(data);
};

// Helper to validate array of Historical Backtest data
export const validateHistoricalBacktestTableData = (data: unknown[]): HistoricalBacktestTableRow[] => {
  return data.map(validateHistoricalBacktestTableRow);
};
