import { v } from 'convex/values';

export const conversionRulesValidator = v.object({
  id: v.string(),
  enabled: v.boolean(),
  name: v.string(),
  sourceAccountId: v.string(),
  targetAccountId: v.string(),
  startTimePoint: v.union(
    v.object({ type: v.literal('immediate') }),
    v.object({ type: v.literal('customAge'), age: v.number() }),
    v.object({ type: v.literal('retirement') })
  ),
  endTimePoint: v.optional(
    v.union(
      v.object({ type: v.literal('customAge'), age: v.number() }),
      v.object({ type: v.literal('rmdAge') })
    )
  ),
  amount: v.union(
    v.object({ type: v.literal('fixedAmount'), dollarAmount: v.number() }),
    v.object({ type: v.literal('fillBracket'), targetBracket: v.number() }),
    v.object({ type: v.literal('fullBalance') })
  ),
});