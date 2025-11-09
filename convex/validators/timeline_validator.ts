import { v } from 'convex/values';

export const timelineValidator = v.object({
  currentAge: v.number(),
  lifeExpectancy: v.number(),
  retirementStrategy: v.union(
    v.object({ type: v.literal('fixedAge'), retirementAge: v.number() }),
    v.object({ type: v.literal('swrTarget'), safeWithdrawalRate: v.number() })
  ),
});
