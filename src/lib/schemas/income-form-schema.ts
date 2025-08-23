import { z } from 'zod';

import { coerceNumber, currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-helpers';

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
        return data.month !== undefined && data.year !== undefined && data.age === undefined;
      }
      if (data.type === 'custom-age') {
        return data.age !== undefined && data.month === undefined && data.year === undefined;
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
      const isOneTime = data.frequency === 'one-time';
      const hasEndTime = !!data.timeframe.end;

      return isOneTime ? !hasEndTime : hasEndTime;
    },
    {
      message: 'One-time frequency should not have an end date, recurring frequencies require an end date',
      path: ['timeframe', 'end'],
    }
  );

const growthSchema = z
  .object({
    growthRate: percentageField(-50, 50, 'Income growth rate').optional(),
    growthLimit: coerceNumber(z.number('Must be a valid growth limit').min(0)).optional(),
  })
  .refine(
    (data) => {
      // If there's a growth limit, there must be a growth rate
      if (data.growthLimit !== undefined) {
        return data.growthRate !== undefined;
      }
      return true;
    },
    {
      message: 'Growth limit requires a growth rate to be set',
      path: ['growthLimit'],
    }
  );

export const incomeFormSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    amount: currencyFieldForbidsZero('Income cannot be negative or zero'),
    growth: growthSchema.optional(),
  })
  .extend(frequencyTimeframeSchema.shape)
  .refine(
    (data) => {
      if (data.growth?.growthLimit === undefined || data.growth?.growthRate === undefined || data.growth.growthRate <= 0) {
        return true;
      }

      return data.growth.growthLimit > data.amount;
    },
    {
      message: 'Growth limit must be greater than Amount for positive growth',
      path: ['growth', 'growthLimit'],
    }
  )
  .refine(
    (data) => {
      if (data.growth?.growthLimit === undefined || data.growth?.growthRate === undefined || data.growth.growthRate >= 0) {
        return true;
      }

      return data.growth.growthLimit < data.amount;
    },
    {
      message: 'Growth limit must be less than Amount for negative growth',
      path: ['growth', 'growthLimit'],
    }
  );

export type IncomeInputs = z.infer<typeof incomeFormSchema>;
