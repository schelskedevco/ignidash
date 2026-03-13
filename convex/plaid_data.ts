// V8 runtime — queries and mutations only (no 'use node')
import { v } from 'convex/values';
import { query, internalQuery, internalMutation } from './_generated/server';

import { getUserIdOrThrow } from './utils/auth_utils';
import { getFinancesForUser } from './utils/finances_utils';
import { deletePlaidItemsForUser } from './utils/plaid_utils';
import {
  PLAID_ACCOUNT_VALIDATOR as ACCOUNT_VALIDATOR,
  PLAID_ASSET_TYPE_VALIDATOR as ASSET_TYPE_VALIDATOR,
  PLAID_LIABILITY_TYPE_VALIDATOR as LIABILITY_TYPE_VALIDATOR,
} from './validators/plaid_validators';

// --- Public queries ---

export const isPlaidConfigured = query({
  handler: async () => {
    return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
  },
});

export const getPlaidItems = query({
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const items = await ctx.db
      .query('plaidItems')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();
    return items.map(({ accessToken: _accessToken, ...rest }) => rest);
  },
});

// --- Internal queries ---

export const getPlaidItemByIdInternal = internalQuery({
  args: { plaidItemId: v.id('plaidItems') },
  handler: async (ctx, { plaidItemId }) => {
    return await ctx.db.get(plaidItemId);
  },
});

export const getPlaidItemByItemId = internalQuery({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    return await ctx.db
      .query('plaidItems')
      .withIndex('by_itemId', (q) => q.eq('itemId', itemId))
      .first();
  },
});

// --- Internal mutations ---

export const storePlaidItem = internalMutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    itemId: v.string(),
    institutionName: v.string(),
    institutionId: v.optional(v.string()),
    accounts: v.array(ACCOUNT_VALIDATOR),
  },
  handler: async (ctx, { userId, accessToken, itemId, institutionName, institutionId, accounts }) => {
    const existing = await ctx.db
      .query('plaidItems')
      .withIndex('by_itemId', (q) => q.eq('itemId', itemId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { accessToken, accounts, institutionName, institutionId });
      return existing._id;
    } else {
      return await ctx.db.insert('plaidItems', { userId, accessToken, itemId, institutionName, institutionId, accounts });
    }
  },
});

export const updateLastSynced = internalMutation({
  args: { plaidItemId: v.id('plaidItems') },
  handler: async (ctx, { plaidItemId }) => {
    await ctx.db.patch(plaidItemId, { lastSyncedAt: Date.now() });
  },
});

export const removePlaidItem = internalMutation({
  args: {
    userId: v.string(),
    plaidItemId: v.id('plaidItems'),
    accounts: v.array(ACCOUNT_VALIDATOR),
  },
  handler: async (ctx, { userId, plaidItemId, accounts }) => {
    await ctx.db.delete(plaidItemId);

    const finances = await getFinancesForUser(ctx, userId);
    if (!finances) return;

    const plaidAccountIds = new Set(accounts.map((a) => a.plaidAccountId));
    const updatedAssets = finances.assets
      .filter((a) => !a.plaidItemId || a.plaidItemId !== plaidItemId)
      .filter((a) => !a.plaidAccountId || !plaidAccountIds.has(a.plaidAccountId));
    const updatedLiabilities = finances.liabilities
      .filter((a) => !a.plaidItemId || a.plaidItemId !== plaidItemId)
      .filter((a) => !a.plaidAccountId || !plaidAccountIds.has(a.plaidAccountId));
    await ctx.db.patch(finances._id, { assets: updatedAssets, liabilities: updatedLiabilities });
  },
});

export const upsertPlaidAssets = internalMutation({
  args: {
    userId: v.string(),
    plaidItemId: v.id('plaidItems'),
    assets: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        value: v.number(),
        updatedAt: v.number(),
        plaidAccountId: v.string(),
        plaidItemId: v.string(),
        type: ASSET_TYPE_VALIDATOR,
      })
    ),
  },
  handler: async (ctx, { userId, plaidItemId, assets }) => {
    const finances = await getFinancesForUser(ctx, userId);

    if (!finances) {
      await ctx.db.insert('finances', { userId, assets, liabilities: [] });
      return;
    }

    const incomingAccountIds = new Set(assets.map((a) => a.plaidAccountId));

    // Remove all existing assets that belong to this institution — both new-style
    // (matched by plaidItemId) and old-style orphans (matched by plaidAccountId).
    const otherAssets = finances.assets.filter(
      (a) => a.plaidItemId !== plaidItemId && !(a.plaidAccountId && incomingAccountIds.has(a.plaidAccountId))
    );

    await ctx.db.patch(finances._id, { assets: [...otherAssets, ...assets] });
  },
});

export const upsertPlaidLiabilities = internalMutation({
  args: {
    userId: v.string(),
    plaidItemId: v.id('plaidItems'),
    liabilities: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        balance: v.number(),
        updatedAt: v.number(),
        plaidAccountId: v.string(),
        plaidItemId: v.string(),
        type: LIABILITY_TYPE_VALIDATOR,
      })
    ),
  },
  handler: async (ctx, { userId, plaidItemId, liabilities }) => {
    const finances = await getFinancesForUser(ctx, userId);

    if (!finances) {
      await ctx.db.insert('finances', { userId, assets: [], liabilities });
      return;
    }

    const incomingAccountIds = new Set(liabilities.map((l) => l.plaidAccountId));

    const otherLiabilities = finances.liabilities.filter(
      (l) => l.plaidItemId !== plaidItemId && !(l.plaidAccountId && incomingAccountIds.has(l.plaidAccountId))
    );

    await ctx.db.patch(finances._id, { liabilities: [...otherLiabilities, ...liabilities] });
  },
});

export const updatePlaidItemAccounts = internalMutation({
  args: {
    plaidItemId: v.id('plaidItems'),
    accounts: v.array(ACCOUNT_VALIDATOR),
  },
  handler: async (ctx, { plaidItemId, accounts }) => {
    await ctx.db.patch(plaidItemId, { accounts });
  },
});

export const deleteAllPlaidItemsForUser = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await deletePlaidItemsForUser(ctx, userId);
  },
});
