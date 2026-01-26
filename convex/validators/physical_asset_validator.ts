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

const financingValidator = v.object({
  downPayment: v.number(),
  loanAmount: v.number(),
  apr: v.number(),
  termMonths: v.number(),
});

export const physicalAssetValidator = v.object({
  id: v.string(),
  name: v.string(),
  purchaseDate: physicalAssetTimePointValidator,
  purchasePrice: v.number(),
  marketValueAtPurchase: v.optional(v.number()),
  annualAppreciationRate: v.number(),
  saleDate: v.optional(physicalAssetTimePointValidator),
  financing: v.optional(financingValidator),
  disabled: v.optional(v.boolean()),
});
