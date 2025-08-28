import { z } from 'zod';
import { currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-helpers';

const baseContributionSchema = z.object({
  accountId: z.string(),
  rank: z.number().int().min(0),
  maxValue: currencyFieldAllowsZero('Max value cannot be negative').optional(),
  incomeIds: z.array(z.string()).optional(),
});

export const contributionFormSchema = z.discriminatedUnion('allocationType', [
  // Fixed amount allocation
  z.object({
    ...baseContributionSchema.shape,
    allocationType: z.literal('fixed'),
    amount: currencyFieldAllowsZero('Amount must be positive'),
  }),

  // Percentage of remaining allocation
  z.object({
    ...baseContributionSchema.shape,
    allocationType: z.literal('percentage'),
    amount: percentageField(0, 100, 'Percentage of remaining funds'),
  }),

  // Unlimited allocation
  z.object({
    ...baseContributionSchema.shape,
    allocationType: z.literal('unlimited'),
  }),
]);

export type ContributionInputs = z.infer<typeof contributionFormSchema>;
