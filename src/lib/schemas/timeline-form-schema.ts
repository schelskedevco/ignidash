import { z } from 'zod';

import { ageField, percentageField } from '@/lib/utils/zod-schema-utils';

export const retirementStrategySchema = z.discriminatedUnion('type', [
  z.object({
    retirementAge: ageField(19, 73, {
      min: 'Retirement age must be at least 19 years',
      max: 'Retirement age must be at most 73 years',
    }),
    type: z.literal('fixedAge'),
  }),
  z.object({
    safeWithdrawalRate: percentageField(2, 6, 'Safe withdrawal rate'),
    type: z.literal('swrTarget'),
  }),
]);

export const timelineFormSchema = z
  .object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    lifeExpectancy: ageField(50, 110, {
      min: 'Life expectancy must be at least 50 years',
      max: 'Life expectancy must be at most 110 years',
    }),
    currentAge: ageField(18, 100, {
      min: 'Age must be at least 18 years',
      max: 'Age must be at most 100 years',
    }),
    retirementStrategy: retirementStrategySchema,
  })
  .refine((data) => data.currentAge < data.lifeExpectancy, {
    message: 'Life expectancy must be greater than current age',
    path: ['currentAge'],
  })
  .refine(
    (data) => {
      if (data.retirementStrategy.type !== 'fixedAge') return true;
      return data.currentAge <= data.retirementStrategy.retirementAge && data.retirementStrategy.retirementAge < data.lifeExpectancy;
    },
    {
      message: 'Retirement age must be between current age and life expectancy',
      path: ['retirementStrategy', 'retirementAge'],
    }
  );

export type RetirementStrategyInputs = z.infer<typeof retirementStrategySchema>;
export type TimelineInputs = z.infer<typeof timelineFormSchema>;
