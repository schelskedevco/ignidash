import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { assetValidator } from './validators/asset_validator';
import { liabilityValidator } from './validators/liability_validator';
import { getUserIdOrThrow } from './utils/auth_utils';
import { getFinancesForUser } from './utils/finances_utils';
import {
  syncAssetToPlans,
  unsyncAssetFromPlans,
  unsyncAllAssetsFromPlans,
  syncLiabilityToPlans,
  unsyncLiabilityFromPlans,
  unsyncAllLiabilitiesFromPlans,
} from './utils/finance_sync_utils';

function validateUrl(url: string | undefined): void {
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ConvexError('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new ConvexError('URL must use http:// or https://');
  }
}

export const getAssets = query({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUser(ctx, userId);
    if (!finances) return null;

    return finances.assets;
  },
});

export const getLiabilities = query({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUser(ctx, userId);
    if (!finances) return null;

    return finances.liabilities;
  },
});

export const upsertAsset = mutation({
  args: {
    asset: assetValidator,
  },
  handler: async (ctx, { asset: _asset }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    validateUrl(_asset.url);

    const finances = await getFinancesForUser(ctx, userId);

    const asset = { ..._asset, updatedAt: Date.now() };
    if (!finances) {
      await ctx.db.insert('finances', { userId, assets: [asset], liabilities: [] });
      return;
    }

    const existingIndex = finances.assets.findIndex((a) => a.id === asset.id);
    if (existingIndex === -1 && finances.assets.length >= 25) throw new ConvexError('Maximum of 25 assets reached.');

    const updatedAssets =
      existingIndex !== -1 ? finances.assets.map((a, index) => (index === existingIndex ? asset : a)) : [...finances.assets, asset];

    await Promise.all([ctx.db.patch(finances._id, { assets: updatedAssets }), syncAssetToPlans(ctx, userId, asset)]);
  },
});

export const upsertLiability = mutation({
  args: {
    liability: liabilityValidator,
  },
  handler: async (ctx, { liability: _liability }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    validateUrl(_liability.url);

    const finances = await getFinancesForUser(ctx, userId);

    const liability = { ..._liability, updatedAt: Date.now() };
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

    await Promise.all([ctx.db.patch(finances._id, { liabilities: updatedLiabilities }), syncLiabilityToPlans(ctx, userId, liability)]);
  },
});

export const deleteAllFinances = mutation({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUser(ctx, userId);

    if (finances) {
      await Promise.all([ctx.db.delete(finances._id), unsyncAllAssetsFromPlans(ctx, userId), unsyncAllLiabilitiesFromPlans(ctx, userId)]);
    }
  },
});

export const deleteAllAssets = mutation({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUser(ctx, userId);

    if (finances) {
      await Promise.all([ctx.db.patch(finances._id, { assets: [] }), unsyncAllAssetsFromPlans(ctx, userId)]);
    }
  },
});

export const deleteAllLiabilities = mutation({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUser(ctx, userId);

    if (finances) {
      await Promise.all([ctx.db.patch(finances._id, { liabilities: [] }), unsyncAllLiabilitiesFromPlans(ctx, userId)]);
    }
  },
});

export const deleteAsset = mutation({
  args: {
    assetId: v.string(),
  },
  handler: async (ctx, { assetId }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUser(ctx, userId);
    if (!finances) return;

    const updatedAssets = finances.assets.filter((a) => a.id !== assetId);

    await Promise.all([ctx.db.patch(finances._id, { assets: updatedAssets }), unsyncAssetFromPlans(ctx, userId, assetId)]);
  },
});

export const deleteLiability = mutation({
  args: {
    liabilityId: v.string(),
  },
  handler: async (ctx, { liabilityId }) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const finances = await getFinancesForUser(ctx, userId);
    if (!finances) return;

    const updatedLiabilities = finances.liabilities.filter((l) => l.id !== liabilityId);

    await Promise.all([
      ctx.db.patch(finances._id, { liabilities: updatedLiabilities }),
      unsyncLiabilityFromPlans(ctx, userId, liabilityId),
    ]);
  },
});
