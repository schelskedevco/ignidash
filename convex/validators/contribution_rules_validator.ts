import { v } from 'convex/values';

export const contributionRulesValidator = v.object({
  id: v.string(),
  accountId: v.string(),
  rank: v.number(),
  amount: v.union(
    v.object({ type: v.literal('dollarAmount'), dollarAmount: v.number() }),
    v.object({ type: v.literal('percentRemaining'), percentRemaining: v.number() }),
    v.object({ type: v.literal('unlimited') })
  ),
  disabled: v.boolean(),
  maxBalance: v.optional(v.number()),
  incomeId: v.optional(v.string()),
  employerMatch: v.optional(v.number()),
  enableMegaBackdoorRoth: v.optional(v.boolean()),
  // Deprecated — kept for migration compatibility
  incomeIds: v.optional(v.array(v.string())),
});

export const baseContributionRuleValidator = v.object({
  type: v.union(v.literal('spend'), v.literal('save')),
});
