import { ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { assetValidator } from './validators/asset_validator';
import { liabilityValidator } from './validators/liability_validator';
import { getUserIdOrThrow } from './utils/auth_utils';
import { getFinancesForUserId } from './utils/finances_utils';

export const getAssets = query({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);
    if (!finances) return null;

    return finances.assets;
  },
});

export const getLiabilities = query({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);
    if (!finances) return null;

    return finances.liabilities;
  },
});

export const upsertAsset = mutation({
  args: {
    asset: assetValidator,
  },
  handler: async (ctx, { asset }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);

    if (!finances) {
      await ctx.db.insert('finances', { userId, assets: [asset], liabilities: [] });
      return;
    }

    const existingIndex = finances.assets.findIndex((a) => a.id === asset.id);
    if (existingIndex === -1 && finances.assets.length >= 25) throw new ConvexError('Maximum of 25 assets reached.');

    const updatedAssets =
      existingIndex !== -1 ? finances.assets.map((a, index) => (index === existingIndex ? asset : a)) : [...finances.assets, asset];

    await ctx.db.patch(finances._id, { assets: updatedAssets });
  },
});

export const upsertLiability = mutation({
  args: {
    liability: liabilityValidator,
  },
  handler: async (ctx, { liability }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);

    if (!finances) {
      await ctx.db.insert('finances', { userId, assets: [], liabilities: [liability] });
      return;
    }

    const existingIndex = finances.liabilities.findIndex((l) => l.id === liability.id);
    if (existingIndex === -1 && finances.liabilities.length >= 25) throw new ConvexError('Maximum of 25 liabilities reached.');

    const updatedLiabilities =
      existingIndex !== -1
        ? finances.liabilities.map((l, index) => (index === existingIndex ? liability : l))
        : [...finances.liabilities, liability];

    await ctx.db.patch(finances._id, { liabilities: updatedLiabilities });
  },
});

export const deleteAllFinances = mutation({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);

    if (finances) await ctx.db.delete(finances._id);
  },
});

export const deleteAllAssets = mutation({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);

    if (finances) await ctx.db.patch(finances._id, { assets: [] });
  },
});

export const deleteAllLiabilities = mutation({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);

    if (finances) await ctx.db.patch(finances._id, { liabilities: [] });
  },
});
