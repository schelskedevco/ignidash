import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { physicalAssetValidator } from './validators/physical_asset_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const getPhysicalAssets = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.physicalAssets ?? [];
  },
});

export const getCountOfPhysicalAssets = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return (plan.physicalAssets ?? []).length;
  },
});

export const getPhysicalAsset = query({
  args: { planId: v.id('plans'), physicalAssetId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, physicalAssetId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const physicalAsset = (plan.physicalAssets ?? []).find((pa) => pa.id === physicalAssetId);
    return physicalAsset || null;
  },
});

export const upsertPhysicalAsset = mutation({
  args: {
    planId: v.id('plans'),
    physicalAsset: physicalAssetValidator,
  },
  handler: async (ctx, { planId, physicalAsset }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);
    const physicalAssets = plan.physicalAssets ?? [];

    const existingIndex = physicalAssets.findIndex((pa) => pa.id === physicalAsset.id);
    if (existingIndex === -1 && physicalAssets.length >= 10) throw new ConvexError('Maximum of 10 physical assets reached.');

    const updatedPhysicalAssets =
      existingIndex !== -1
        ? physicalAssets.map((pa, index) => (index === existingIndex ? physicalAsset : pa))
        : [...physicalAssets, physicalAsset];

    await ctx.db.patch(planId, { physicalAssets: updatedPhysicalAssets });
  },
});

export const deletePhysicalAsset = mutation({
  args: {
    planId: v.id('plans'),
    physicalAssetId: v.string(),
  },
  handler: async (ctx, { planId, physicalAssetId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const updatedPhysicalAssets = (plan.physicalAssets ?? []).filter((pa) => pa.id !== physicalAssetId);

    await ctx.db.patch(planId, { physicalAssets: updatedPhysicalAssets });
  },
});
