import { z } from 'zod';

import { formatNumber } from '@/lib/utils';
import { currencyFieldForbidsZero } from '@/lib/utils/zod-schema-helpers';

import { growthSchema, frequencyTimeframeSchema } from './income-expenses-shared-schemas';

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

export const frequencyForDisplay = (frequency: NonNullable<ExpenseInputs['frequency']>) => {
  switch (frequency) {
    case 'yearly':
      return 'yearly';
    case 'oneTime':
      return 'one-time';
    case 'quarterly':
      return 'quarterly';
    case 'monthly':
      return 'monthly';
    case 'biweekly':
      return 'biweekly';
    case 'weekly':
      return 'weekly';
  }
};
