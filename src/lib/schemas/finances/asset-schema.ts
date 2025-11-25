import { z } from 'zod';

import { currencyFieldAllowsZero } from '@/lib/utils/zod-schema-utils';

export const assetFormSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  value: currencyFieldAllowsZero('Value cannot be negative'),
  updatedAt: z.number(),
  type: z.enum([
    'savings',
    'checking',
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

export type AssetInputs = z.infer<typeof assetFormSchema>;

export const assetTypeForDisplay = (type: AssetInputs['type']): string => {
  switch (type) {
    case 'savings':
      return 'Savings';
    case 'checking':
      return 'Checking';
    case 'taxableBrokerage':
      return 'Taxable';
    case 'roth401k':
      return 'Roth 401(k)';
    case 'rothIra':
      return 'Roth IRA';
    case '401k':
      return '401(k)';
    case 'ira':
      return 'IRA';
    case 'hsa':
      return 'HSA';
    case 'realEstate':
      return 'Real Estate';
    case 'vehicle':
      return 'Vehicle';
    case 'preciousMetals':
      return 'Precious Metals';
    case 'other':
      return 'Other Asset';
  }
};
