import { z } from 'zod';

import { currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-utils';

import { growthSchema, frequencyTimeframeSchema } from './income-expenses-shared-schemas';

export type IncomeType = 'wage' | 'exempt' | 'selfEmployment' | 'socialSecurity' | 'pension';

export const incomeTaxSchema = z
  .object({
    incomeType: z.enum(['wage', 'exempt', 'selfEmployment', 'socialSecurity', 'pension']),
    withholding: percentageField(0, 50, 'Withholding').optional(),
  })
  .refine(
    (data) => {
      if (data.incomeType === 'wage') {
        return data.withholding !== undefined;
      }
      return true;
    },
    {
      message: 'Withholding required for wage income',
      path: ['withholding'],
    }
  )
  .refine(
    (data) => {
      return !['selfEmployment', 'socialSecurity', 'pension'].includes(data.incomeType);
    },
    {
      message: 'This income type is not yet supported',
      path: ['incomeType'],
    }
  );

export const incomeFormSchema = z
  .object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    amount: currencyFieldForbidsZero('Income cannot be negative or zero'),
    growth: growthSchema.optional(),
    taxes: incomeTaxSchema,
    disabled: z.boolean().optional(),
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

export const supportsWithholding = (incomeType: IncomeType): boolean => {
  switch (incomeType) {
    case 'wage':
      return true;
    case 'exempt':
    case 'selfEmployment':
    case 'socialSecurity':
    case 'pension':
      return false;
  }
};
