import { z } from 'zod';
import { currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-utils';
import { timePointSchema } from './income-expenses-shared-schemas';

export const compoundingFrequencySchema = z.enum(['daily', 'monthly']);

export type CompoundingFrequency = z.infer<typeof compoundingFrequencySchema>;

export const debtFormSchema = z
  .object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    balance: currencyFieldForbidsZero('Balance must be greater than zero'),
    apr: percentageField(0, 40, 'APR'),
    interestType: z.enum(['simple', 'compound']),
    compoundingFrequency: compoundingFrequencySchema.optional(),
    startDate: timePointSchema,
    monthlyPayment: currencyFieldForbidsZero('Monthly payment must be greater than zero'),
    disabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Compounding frequency required only for compound interest
      if (data.interestType === 'compound') {
        return data.compoundingFrequency !== undefined;
      }
      return true;
    },
    {
      message: 'Compounding frequency is required for compound interest',
      path: ['compoundingFrequency'],
    }
  );

export type DebtInputs = z.infer<typeof debtFormSchema>;
