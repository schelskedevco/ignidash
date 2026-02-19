import { v } from 'convex/values';

const debtTimePointValidator = v.object({
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

export const debtValidator = v.object({
  id: v.string(),
  name: v.string(),
  balance: v.number(),
  apr: v.number(),
  interestType: v.union(v.literal('simple'), v.literal('compound')),
  compoundingFrequency: v.optional(v.union(v.literal('daily'), v.literal('monthly'))),
  startDate: debtTimePointValidator,
  monthlyPayment: v.number(),
  disabled: v.optional(v.boolean()),
  syncedFinanceId: v.optional(v.string()),
});
