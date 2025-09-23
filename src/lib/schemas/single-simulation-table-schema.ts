import { z } from 'zod';

import type { ColumnFormat } from '@/lib/types/column-format';

export const singleSimulationTableRowSchema = z.object({
  year: z.number(),
  age: z.number(),
  phaseName: z.string().nullable(),
  portfolioValue: z.number(),
  stockValue: z.number(),
  stockReturn: z.number().nullable(),
  bondValue: z.number(),
  bondReturn: z.number().nullable(),
  cashValue: z.number(),
  cashReturn: z.number().nullable(),
  inflationRate: z.number().nullable(),
  historicalYear: z.number().nullable(),
});

export type SingleSimulationTableRow = z.infer<typeof singleSimulationTableRowSchema>;

const SINGLE_SIMULATION_COLUMNS = {
  year: { title: 'Year', format: 'number' },
  age: { title: 'Age', format: 'number' },
  phaseName: { title: 'Phase Name', format: 'string' },
  portfolioValue: { title: 'Portfolio Value', format: 'currency' },
  stockValue: { title: 'Stock Value', format: 'currency' },
  stockReturn: { title: 'Stock Return', format: 'percentage' },
  bondValue: { title: 'Bond Value', format: 'currency' },
  bondReturn: { title: 'Bond Return', format: 'percentage' },
  cashValue: { title: 'Cash Value', format: 'currency' },
  cashReturn: { title: 'Cash Return', format: 'percentage' },
  inflationRate: { title: 'Inflation Rate', format: 'percentage' },
  historicalYear: { title: 'Historical Year', format: 'number' },
} as const;

export const SIMULATION_TABLE_CONFIG: Record<keyof SingleSimulationTableRow, { title: string; format: ColumnFormat }> =
  SINGLE_SIMULATION_COLUMNS;
