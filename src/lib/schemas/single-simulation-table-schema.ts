import { z } from 'zod';

export const singleSimulationTableRowSchema = z.object({
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

export type SingleSimulationTableRow = z.infer<typeof singleSimulationTableRowSchema>;

export type ColumnFormat = 'number' | 'currency' | 'percentage' | 'string' | 'historicalRanges';

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

export const SIMULATION_TABLE_CONFIG: Record<keyof SingleSimulationTableRow, { title: string; format: ColumnFormat }> = SIMULATION_COLUMNS;

const validateSingleSimulationTableRow = (data: unknown): SingleSimulationTableRow => {
  return singleSimulationTableRowSchema.parse(data);
};

export const validateSingleSimulationTableData = (data: unknown[]): SingleSimulationTableRow[] => {
  return data.map(validateSingleSimulationTableRow);
};
