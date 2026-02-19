import { v } from 'convex/values';

export const accountValidator = v.object({
  id: v.string(),
  name: v.string(),
  balance: v.number(),
  type: v.union(
    v.literal('savings'),
    v.literal('taxableBrokerage'),
    v.literal('roth401k'),
    v.literal('roth403b'),
    v.literal('rothIra'),
    v.literal('401k'),
    v.literal('403b'),
    v.literal('ira'),
    v.literal('hsa')
  ),
  percentBonds: v.optional(v.number()),
  costBasis: v.optional(v.number()),
  contributionBasis: v.optional(v.number()),
  syncedFinanceId: v.optional(v.string()),
});
