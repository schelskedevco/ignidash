import { v } from 'convex/values';

const physicalAssetTimePointValidator = v.object({
  type: v.union(
    v.literal('now'),
    v.literal('atRetirement'),
    v.literal('atLifeExpectancy'),
    v.literal('customDate'),
    v.literal('customAge')
  ),
  month: v.optional(v.number()),
  year: v.optional(v.number()),
  age: v.optional(v.number()),
});

const cashPaymentValidator = v.object({
  type: v.literal('cash'),
});

const loanPaymentValidator = v.object({
  type: v.literal('loan'),
  downPayment: v.optional(v.number()),
  loanBalance: v.number(),
  apr: v.number(),
  monthlyPayment: v.number(),
});

const paymentMethodValidator = v.union(cashPaymentValidator, loanPaymentValidator);

export const physicalAssetValidator = v.object({
  id: v.string(),
  name: v.string(),
  purchaseDate: physicalAssetTimePointValidator,
  purchasePrice: v.number(),
  marketValue: v.optional(v.number()),
  appreciationRate: v.number(),
  saleDate: v.optional(physicalAssetTimePointValidator),
  paymentMethod: paymentMethodValidator,
});
