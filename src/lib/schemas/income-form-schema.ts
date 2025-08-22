import { z } from 'zod';

import { currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-helpers';

const timePointSchema = z
  .object({
    type: z.enum(['now', 'at-retirement', 'at-life-expectancy', 'custom-date', 'custom-age']),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    age: z.number().int().min(0).max(120).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'custom-date') {
        return data.month !== undefined && data.year !== undefined;
      }
      if (data.type === 'custom-age') {
        return data.age !== undefined;
      }
      return true;
    },
    {
      message: 'Custom fields are required when custom option is selected',
    }
  );

const frequencyTimeframeSchema = z
  .object({
    frequency: z.enum(['yearly', 'one-time', 'quarterly', 'monthly', 'biweekly', 'weekly']),
    timeframe: z.object({
      start: timePointSchema,
      end: timePointSchema.optional(),
    }),
  })
  .refine(
    (data) => {
      // One-time should not have an end date
      if (data.frequency === 'one-time') {
        return !data.timeframe.end;
      }

      // All other frequencies require an end date
      return !!data.timeframe.end;
    },
    {
      message: 'One-time frequency should not have an end date, recurring frequencies require an end date',
      path: ['timeframe', 'end'],
    }
  );

const growthSchema = z.object({
  growthRate: percentageField(-50, 50, 'Income growth rate'),
  growthLimit: z.number('Must be a valid growth limit').min(0).optional(),
});

export const incomeFormSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    amount: currencyFieldForbidsZero('Income cannot be negative or zero'),
    growth: growthSchema,
  })
  .extend(frequencyTimeframeSchema.shape)
  .refine(
    (data) => {
      // Skip if no limit, growth is 0, or growth is negative
      if (!data.growth.growthLimit || data.growth.growthRate <= 0) {
        return true;
      }

      // Positive growth: limit must be greater than current amount
      return data.growth.growthLimit > data.amount;
    },
    {
      message: 'Growth limit must be greater than current amount for positive growth',
      path: ['growth', 'growthLimit'],
    }
  )
  .refine(
    (data) => {
      // Skip if no limit, growth is 0, or growth is positive
      if (!data.growth.growthLimit || data.growth.growthRate >= 0) {
        return true;
      }

      // Negative growth: limit must be less than current amount
      return data.growth.growthLimit < data.amount;
    },
    {
      message: 'Growth limit must be less than current amount for negative growth',
      path: ['growth', 'growthLimit'],
    }
  );

export type IncomeInputs = z.infer<typeof incomeFormSchema>;
