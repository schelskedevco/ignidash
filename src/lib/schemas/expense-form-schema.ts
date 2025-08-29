import { z } from 'zod';

import { formatNumber } from '@/lib/utils';
import { coerceNumber, currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-helpers';

const timePointSchema = z
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

const frequencyTimeframeSchema = z
  .object({
    frequency: z.enum(['yearly', 'oneTime', 'quarterly', 'monthly', 'biweekly', 'weekly']),
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

const growthSchema = z
  .object({
    growthRate: percentageField(-50, 50, 'Expense growth rate').optional(),
    growthLimit: coerceNumber(z.number('Must be a valid growth limit').min(0)).optional(),
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

export const expenseFormSchema = z
  .object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    amount: currencyFieldForbidsZero('Expense cannot be negative or zero'),
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

export type ExpenseInputs = z.infer<typeof expenseFormSchema>;

export const timeFrameForDisplay = (
  startType: ExpenseInputs['timeframe']['start']['type'],
  endType?: NonNullable<ExpenseInputs['timeframe']['end']>['type']
) => {
  function labelFromType(type: ExpenseInputs['timeframe']['start']['type']) {
    switch (type) {
      case 'now':
        return 'Now';
      case 'atRetirement':
        return 'Retirement';
      case 'atLifeExpectancy':
        return 'Life Expectancy';
      case 'customDate':
        return 'Custom Date';
      case 'customAge':
        return 'Custom Age';
    }
  }

  const startLabel = labelFromType(startType);
  const endLabel = endType ? labelFromType(endType) : undefined;

  if (!endLabel) return startLabel;
  return `${startLabel} to ${endLabel}`;
};

export const growthForDisplay = (
  growthRate: NonNullable<ExpenseInputs['growth']>['growthRate'],
  growthLimit: NonNullable<ExpenseInputs['growth']>['growthLimit']
) => {
  if (growthRate === undefined) return 'No Growth';

  const rate = formatNumber(growthRate, 1);
  if (growthLimit === undefined) return `Rate: ${rate}%, No Limit`;

  return `Rate: ${rate}%, Limit: ${formatNumber(growthLimit, 0, '$')}`;
};
