import { z } from 'zod';

import { ageField, percentageField } from '@/lib/utils/zod-schema-helpers';

export const retirementStrategySchema = z.discriminatedUnion('type', [
  z.object({
    retirementAge: ageField(17, 73, {
      min: 'Retirement age must be at least 17 years',
      max: 'Retirement age must be at most 73 years',
    }),
    type: z.literal('fixedAge'),
  }),
  z.object({
    safeWithdrawalRate: percentageField(2, 6, 'Safe withdrawal rate'),
    // expenseMetric: z.enum(['median', 'mean']),
    type: z.literal('swrTarget'),
  }),
]);

export const timelineFormSchema = z.object({
  id: z.string(),
  lifeExpectancy: ageField(50, 110, {
    min: 'Life expectancy must be at least 50 years',
    max: 'Life expectancy must be at most 110 years',
  }),
  currentAge: ageField(16, 100, {
    min: 'You must be at least 16 years old to use this calculator',
    max: 'Age cannot exceed 100 years',
  }),
  retirementStrategy: retirementStrategySchema,
});

export type RetirementStrategyInputs = z.infer<typeof retirementStrategySchema>;
export type TimelineInputs = z.infer<typeof timelineFormSchema>;
