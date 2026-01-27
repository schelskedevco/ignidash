import { z } from 'zod';
import { currencyFieldForbidsZero, currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-utils';
import { timePointSchema } from './income-expenses-shared-schemas';

const financingSchema = z.object({
  downPayment: currencyFieldAllowsZero('Down payment cannot be negative'),
  loanBalance: currencyFieldForbidsZero('Loan balance must be greater than zero'),
  apr: percentageField(0, 25, 'APR'),
  monthlyPayment: currencyFieldForbidsZero('Monthly payment must be greater than zero'),
});

export type FinancingInputs = z.infer<typeof financingSchema>;

export const physicalAssetFormSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  purchaseDate: timePointSchema,
  purchasePrice: currencyFieldForbidsZero('Purchase price must be greater than zero'),
  marketValue: currencyFieldForbidsZero('Market value must be greater than zero').optional(),
  appreciationRate: percentageField(-30, 20, 'Annual appreciation rate'),
  saleDate: timePointSchema,
  financing: financingSchema.optional(),
});

export type PhysicalAssetInputs = z.infer<typeof physicalAssetFormSchema>;

export const isFinancedAsset = (asset: PhysicalAssetInputs): boolean => asset.financing !== undefined;
