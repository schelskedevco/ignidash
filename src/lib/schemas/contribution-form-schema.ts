import { z } from 'zod';
import { currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-utils';

import type { AccountInputs } from './account-form-schema';

export const baseContributionSchema = z.object({
  type: z.enum(['spend', 'save']),
});

export type BaseContributionInputs = z.infer<typeof baseContributionSchema>;

const sharedContributionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  rank: z.number().int().min(0),
  maxBalance: currencyFieldForbidsZero('Max balance must be greater than zero').optional(),
  incomeIds: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
});

export const contributionFormSchema = z
  .discriminatedUnion('contributionType', [
    z.object({
      ...sharedContributionSchema.shape,
      contributionType: z.literal('dollarAmount'),
      dollarAmount: currencyFieldForbidsZero('Dollar amount must be greater than zero'),
    }),

    z.object({
      ...sharedContributionSchema.shape,
      contributionType: z.literal('percentRemaining'),
      percentRemaining: percentageField(0, 100, 'Percentage of remaining funds'),
    }),

    z.object({
      ...sharedContributionSchema.shape,
      contributionType: z.literal('unlimited'),
    }),
  ])
  .refine((data) => data.accountId !== '', {
    message: 'Account must be selected',
    path: ['accountId'],
  });

export type ContributionInputs = z.infer<typeof contributionFormSchema>;

export const supportsIncomeAllocation = (type: AccountInputs['type']): boolean => {
  switch (type) {
    case 'savings':
      return false;
    case 'roth401k':
    case 'rothIra':
    case '401k':
    case 'ira':
    case 'taxableBrokerage':
    case 'hsa':
      return true;
  }
};
