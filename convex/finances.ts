import { v } from 'convex/values';
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

export const upsertAssets = mutation({
  args: {
    assets: v.array(assetValidator),
  },
  handler: async (ctx, { assets }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);

    if (!finances) return await ctx.db.insert('finances', { userId, assets, liabilities: [] });
    return await ctx.db.patch(finances._id, { assets });
  },
});

export const upsertLiabilities = mutation({
  args: {
    liabilities: v.array(liabilityValidator),
  },
  handler: async (ctx, { liabilities }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUserId(ctx, userId);

    if (!finances) return await ctx.db.insert('finances', { userId, assets: [], liabilities });
    return await ctx.db.patch(finances._id, { liabilities });
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
