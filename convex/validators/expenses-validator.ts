import { v } from 'convex/values';

export const expenseValidator = v.object({
  id: v.string(),
  name: v.string(),
  amount: v.number(),
  frequency: v.union(
    v.literal('yearly'),
    v.literal('oneTime'),
    v.literal('quarterly'),
    v.literal('monthly'),
    v.literal('biweekly'),
    v.literal('weekly')
  ),
  timeframe: v.object({
    start: v.object({
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
    }),
    end: v.optional(
      v.object({
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
      })
    ),
  }),
  growth: v.optional(
    v.object({
      growthRate: v.optional(v.number()),
      growthLimit: v.optional(v.number()),
    })
  ),
  disabled: v.boolean(),
});
