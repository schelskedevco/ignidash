import { v } from 'convex/values';

export const timelineValidator = v.object({
  currentAge: v.number(), // deprecated
  birthMonth: v.optional(v.number()),
  birthYear: v.optional(v.number()),
  lifeExpectancy: v.number(),
  retirementStrategy: v.union(
    v.object({ type: v.literal('fixedAge'), retirementAge: v.number() }),
    v.object({ type: v.literal('swrTarget'), safeWithdrawalRate: v.number() })
  ),
});
