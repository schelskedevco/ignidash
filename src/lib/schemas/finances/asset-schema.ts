import { z } from 'zod';

import { currencyFieldAllowsZero } from '@/lib/utils/zod-schema-utils';

export const assetSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  value: currencyFieldAllowsZero('Value cannot be negative'),
  type: z.enum([
    'savings',
    'taxableBrokerage',
    'roth401k',
    'rothIra',
    '401k',
    'ira',
    'hsa',
    'realEstate',
    'vehicle',
    'preciousMetals',
    'other',
  ]),
});

export type AssetInputs = z.infer<typeof assetSchema>;
