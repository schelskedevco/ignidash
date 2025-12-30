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
    birthMonth: z.number().int().min(1).max(12),
    birthYear: z.number().int().min(1925).max(2025),
    lifeExpectancy: ageField(50, 110, {
      min: 'Life expectancy must be at least 50 years',
      max: 'Life expectancy must be at most 110 years',
    }),
    retirementStrategy: retirementStrategySchema,
  })
  .refine(
    (data) => {
      const currentAge = calculateAge(data.birthMonth, data.birthYear);
      return currentAge >= 18 && currentAge <= 100;
    },
    {
      message: 'You must be between 18 and 100 years old',
      path: ['birthYear'],
    }
  )
  .refine(
    (data) => {
      const currentAge = calculateAge(data.birthMonth, data.birthYear);
      return currentAge < data.lifeExpectancy;
    },
    {
      message: 'Life expectancy must be greater than current age',
      path: ['lifeExpectancy'],
    }
  )
  .refine(
    (data) => {
      if (data.retirementStrategy.type !== 'fixedAge') return true;
      const currentAge = calculateAge(data.birthMonth, data.birthYear);
      return currentAge <= data.retirementStrategy.retirementAge && data.retirementStrategy.retirementAge < data.lifeExpectancy;
    },
    {
      message: 'Retirement age must be between current age and life expectancy',
      path: ['retirementStrategy', 'retirementAge'],
    }
  );

export type RetirementStrategyInputs = z.infer<typeof retirementStrategySchema>;
export type TimelineInputs = z.infer<typeof timelineFormSchema>;

export function calculateAge(birthMonth: number, birthYear: number): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth) {
    age--;
  }
  return age;
}
