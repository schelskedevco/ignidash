import { z } from 'zod';

import { percentageField, currencyFieldAllowsZero } from '@/lib/utils/zod-schema-utils';

// Shared time point schema for income and expenses
export const timePointSchema = z
  .object({
    type: z.enum(['now', 'atRetirement', 'atLifeExpectancy', 'customDate', 'customAge']),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    age: z.number().int().min(0).max(120).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'customDate') {
        return data.month !== undefined && data.year !== undefined && data.age === undefined;
      }
      if (data.type === 'customAge') {
        return data.age !== undefined && data.month === undefined && data.year === undefined;
      }
      return true;
    },
    {
      message: 'Custom fields are required when custom option is selected',
    }
  );

export type TimePoint = z.infer<typeof timePointSchema>;

// Shared frequency schema for income and expenses
export const frequencySchema = z.enum(['yearly', 'oneTime', 'quarterly', 'monthly', 'biweekly', 'weekly']);

export type Frequency = z.infer<typeof frequencySchema>;

// Shared frequency and timeframe schema for income and expenses
export const frequencyTimeframeSchema = z
  .object({
    frequency: frequencySchema,
    timeframe: z.object({
      start: timePointSchema,
      end: timePointSchema.optional(),
    }),
  })
  .refine(
    (data) => {
      const isOneTime = data.frequency === 'oneTime';
      const hasEndTime = !!data.timeframe.end;

      return isOneTime ? !hasEndTime : hasEndTime;
    },
    {
      message: 'One-time frequency should not have an end date, recurring frequencies require an end date',
      path: ['timeframe', 'end'],
    }
  );

export type FrequencyTimeframe = z.infer<typeof frequencyTimeframeSchema>;

// Shared growth schema for income and expenses
export const growthSchema = z
  .object({
    growthRate: percentageField(-50, 50, 'Growth rate').optional(),
    growthLimit: currencyFieldAllowsZero('Growth limit cannot be negative').optional(),
  })
  .refine(
    (data) => {
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

export type Growth = z.infer<typeof growthSchema>;
