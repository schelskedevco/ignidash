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
  inflationRate: z.number(),
});

// Infer TypeScript type from schema
export type SimulationTableRow = z.infer<typeof simulationTableRowSchema>;

// Format types for different data presentations
export type ColumnFormat = 'number' | 'currency' | 'percentage' | 'string';

// Table configuration with presentation metadata
export const SIMULATION_TABLE_CONFIG = {
  year: { title: 'Year', format: 'number' as const },
  age: { title: 'Age', format: 'number' as const },
  phaseName: { title: 'Phase Name', format: 'string' as const },
  portfolioValue: { title: 'Portfolio Value', format: 'currency' as const },
  stocksValue: { title: 'Stocks Value', format: 'currency' as const },
  stocksReturn: { title: 'Stocks Return', format: 'percentage' as const },
  bondsValue: { title: 'Bonds Value', format: 'currency' as const },
  bondsReturn: { title: 'Bonds Return', format: 'percentage' as const },
  cashValue: { title: 'Cash Value', format: 'currency' as const },
  cashReturn: { title: 'Cash Return', format: 'percentage' as const },
  inflationRate: { title: 'Inflation Rate', format: 'percentage' as const },
} as const satisfies Record<keyof SimulationTableRow, { title: string; format: ColumnFormat }>;

// Type for table configuration
export type SimulationTableConfig = typeof SIMULATION_TABLE_CONFIG;

// Helper to validate simulation data at runtime
export const validateSimulationTableRow = (data: unknown): SimulationTableRow => {
  return simulationTableRowSchema.parse(data);
};

// Helper to validate array of simulation data
export const validateSimulationTableData = (data: unknown[]): SimulationTableRow[] => {
  return data.map(validateSimulationTableRow);
};
