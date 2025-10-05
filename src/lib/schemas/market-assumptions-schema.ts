import { z } from 'zod';

import { percentageField } from '@/lib/utils/zod-schema-helpers';

export const marketAssumptionsSchema = z.object({
  stockReturn: percentageField(0, 20, 'Stock return'),
  stockYield: percentageField(0, 10, 'Stock yield'),
  bondReturn: percentageField(0, 15, 'Bond return'),
  bondYield: percentageField(0, 15, 'Bond yield'),
  cashReturn: percentageField(0, 10, 'Cash return'),
  inflationRate: percentageField(0, 8, 'Inflation rate'),
});

export type MarketAssumptionsInputs = z.infer<typeof marketAssumptionsSchema>;
