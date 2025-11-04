import { z } from 'zod';

import { currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-utils';

import { growthSchema, frequencyTimeframeSchema } from './income-expenses-shared-schemas';

export type TaxTreatmentType = 'wage' | 'selfEmployment' | 'exempt';

export const taxTreatmentSchema = z.object({
  type: z.enum(['wage', 'selfEmployment', 'exempt']),
  withholding: percentageField(0, 50, 'Withholding').optional(),
});

export const incomeFormSchema = z
  .object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    amount: currencyFieldForbidsZero('Income cannot be negative or zero'),
    growth: growthSchema.optional(),
    taxTreatment: taxTreatmentSchema,
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

export const supportsWithholding = (taxTreatmentType: TaxTreatmentType): boolean => {
  switch (taxTreatmentType) {
    case 'wage':
    case 'selfEmployment':
      return true;
    case 'exempt':
      return false;
  }
};
