import { z } from 'zod';
import { currencyFieldForbidsZero, currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-utils';
import { timePointSchema } from './income-expenses-shared-schemas';

const financingSchema = z.object({
  downPayment: currencyFieldAllowsZero('Down payment cannot be negative'),
  loanAmount: currencyFieldForbidsZero('Loan amount must be greater than zero'),
  apr: percentageField(0, 25, 'APR'),
  termMonths: z.number().int().min(1).max(480),
});

export type FinancingInputs = z.infer<typeof financingSchema>;

export const physicalAssetFormSchema = z
  .object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    purchaseDate: timePointSchema,
    /**
     * What was paid for the asset. Used as the cost basis for capital gains calculations.
     * If you already own the asset, this is your original purchase price.
     */
    purchasePrice: currencyFieldForbidsZero('Purchase price must be greater than zero'),
    /**
     * Current market value if different from purchase price.
     * Use this for assets you already own that have appreciated or depreciated since purchase.
     * If omitted, defaults to purchasePrice (i.e., assumed asset was just purchased).
     */
    marketValueAtPurchase: currencyFieldForbidsZero('Market value must be greater than zero').optional(),
    annualAppreciationRate: percentageField(-30, 20, 'Annual appreciation rate'),
    saleDate: timePointSchema.optional(),
    financing: financingSchema.optional(),
    disabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If financed, down payment + loan should equal purchase price
      if (data.financing) {
        const totalFinanced = data.financing.downPayment + data.financing.loanAmount;
        return Math.abs(totalFinanced - data.purchasePrice) < 0.01;
      }
      return true;
    },
    {
      message: 'Down payment plus loan amount must equal purchase price',
      path: ['financing', 'loanAmount'],
    }
  );

export type PhysicalAssetInputs = z.infer<typeof physicalAssetFormSchema>;

export const isFinancedAsset = (asset: PhysicalAssetInputs): boolean => asset.financing !== undefined;
