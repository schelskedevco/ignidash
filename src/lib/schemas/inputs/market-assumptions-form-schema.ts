import { z } from 'zod';

import { percentageField } from '@/lib/utils/zod-schema-utils';

export const marketAssumptionsFormSchema = z
  .object({
    stockReturn: percentageField(0, 20, 'Stock return'),
    stockYield: percentageField(0, 10, 'Stock yield'),
    bondReturn: percentageField(0, 15, 'Bond return'),
    bondYield: percentageField(0, 15, 'Bond yield'),
    cashReturn: percentageField(0, 10, 'Cash return'),
    inflationRate: percentageField(0, 8, 'Inflation rate'),
  })
  .refine((data) => data.stockYield <= data.stockReturn, {
    message: 'Dividend yield cannot exceed total stock return',
    path: ['stockYield'],
  })
  .refine((data) => data.bondYield <= data.bondReturn, {
    message: 'Bond yield cannot exceed total bond return',
    path: ['bondYield'],
  });

export type MarketAssumptionsInputs = z.infer<typeof marketAssumptionsFormSchema>;
