import { z } from 'zod';
import { currencyFieldForbidsZero, currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-utils';
import { timePointSchema } from './income-expenses-shared-schemas';

export const physicalAssetTypeSchema = z.enum(['primaryResidence', 'other']);

export type PhysicalAssetType = z.infer<typeof physicalAssetTypeSchema>;

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

export const physicalAssetFormSchema = z
  .object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    assetType: physicalAssetTypeSchema,
    purchaseDate: timePointSchema,
    purchasePrice: currencyFieldForbidsZero('Purchase price must be greater than zero'),
    marketValue: currencyFieldForbidsZero('Market value must be greater than zero').optional(),
    appreciationRate: percentageField(-30, 20, 'Annual appreciation rate'),
    saleDate: timePointSchema,
    paymentMethod: paymentMethodSchema,
    syncedAssetId: z.string().optional(),
    syncedLiabilityId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod.type === 'loan' && data.purchaseDate.type !== 'now') {
        return data.paymentMethod.downPayment !== undefined;
      }
      return true;
    },
    {
      path: ['paymentMethod', 'downPayment'],
      message: 'Down payment is required when financing a future purchase',
    }
  )
  .refine(
    (data) => {
      if (data.paymentMethod.type === 'loan' && data.purchaseDate.type !== 'now') {
        const downPayment = data.paymentMethod.downPayment ?? 0;
        const loanBalance = data.paymentMethod.loanBalance;

        return Math.abs(downPayment + loanBalance - data.purchasePrice) < 0.01;
      }
      return true;
    },
    {
      path: ['paymentMethod', 'loanBalance'],
      message: 'Down payment + loan balance must equal purchase price',
    }
  );

export type PhysicalAssetInputs = z.infer<typeof physicalAssetFormSchema>;

export const hasLoan = (asset: PhysicalAssetInputs): boolean => asset.paymentMethod.type === 'loan';
