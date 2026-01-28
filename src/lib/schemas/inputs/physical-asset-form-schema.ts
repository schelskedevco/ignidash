import { z } from 'zod';
import { currencyFieldForbidsZero, currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-utils';
import { timePointSchema } from './income-expenses-shared-schemas';

const cashPaymentSchema = z.object({
  type: z.literal('cash'),
});

const loanPaymentSchema = z.object({
  type: z.literal('loan'),
  downPayment: currencyFieldAllowsZero('Down payment cannot be negative').optional(),
  loanBalance: currencyFieldForbidsZero('Loan balance must be greater than zero'),
  apr: percentageField(0, 25, 'APR'),
  monthlyPayment: currencyFieldForbidsZero('Monthly payment must be greater than zero'),
});

const paymentMethodSchema = z.discriminatedUnion('type', [cashPaymentSchema, loanPaymentSchema]);

export type PaymentMethodInputs = z.infer<typeof paymentMethodSchema>;

export const physicalAssetFormSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  purchaseDate: timePointSchema,
  purchasePrice: currencyFieldForbidsZero('Purchase price must be greater than zero'),
  marketValue: currencyFieldForbidsZero('Market value must be greater than zero').optional(),
  appreciationRate: percentageField(-30, 20, 'Annual appreciation rate'),
  saleDate: timePointSchema,
  paymentMethod: paymentMethodSchema,
});

export type PhysicalAssetInputs = z.infer<typeof physicalAssetFormSchema>;

export const hasLoan = (asset: PhysicalAssetInputs): boolean => asset.paymentMethod.type === 'loan';
