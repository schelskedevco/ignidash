import { v } from 'convex/values';

export const assetValidator = v.object({
  id: v.string(),
  name: v.string(),
  value: v.number(),
  updatedAt: v.number(),
  url: v.optional(v.string()),
  type: v.union(
    v.literal('savings'),
    v.literal('checking'),
    v.literal('taxableBrokerage'),
    v.literal('roth401k'),
    v.literal('roth403b'),
    v.literal('rothIra'),
    v.literal('401k'),
    v.literal('403b'),
    v.literal('ira'),
    v.literal('hsa'),
    v.literal('realEstate'),
    v.literal('vehicle'),
    v.literal('preciousMetals'),
    v.literal('other')
  ),
});
