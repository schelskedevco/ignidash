'use node';

import { v, ConvexError } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

import { PLAID_ACCOUNT_VALIDATOR as ACCOUNT_VALIDATOR } from './validators/plaid_validators';

type AssetType =
  | 'savings'
  | 'checking'
  | 'taxableBrokerage'
  | 'roth401k'
  | 'roth403b'
  | 'rothIra'
  | '401k'
  | '403b'
  | 'ira'
  | 'hsa'
  | 'realEstate'
  | 'vehicle'
  | 'preciousMetals'
  | 'other';

type LiabilityType = 'mortgage' | 'autoLoan' | 'studentLoan' | 'personalLoan' | 'creditCard' | 'medicalDebt' | 'other';

function mapPlaidSubtypeToAssetType(subtype: string | null | undefined): AssetType {
  const s = (subtype ?? '').toLowerCase();
  if (s === 'roth' || s === 'roth ira') return 'rothIra';
  if (s === 'ira' || s === 'traditional ira') return 'ira';
  if (s === 'roth 401k' || s === 'roth 401(k)') return 'roth401k';
  if (s === '401k' || s === '401(k)') return '401k';
  if (s === 'roth 403b' || s === 'roth 403(b)') return 'roth403b';
  if (s === '403b' || s === '403(b)') return '403b';
  if (s === 'hsa') return 'hsa';
  if (s === 'brokerage' || s === 'taxable brokerage') return 'taxableBrokerage';
  if (s === 'checking') return 'checking';
  if (s === 'savings') return 'savings';
  return 'other';
}

function mapPlaidSubtypeToLiabilityType(subtype: string | null | undefined): LiabilityType {
  const s = (subtype ?? '').toLowerCase();
  if (s === 'credit card') return 'creditCard';
  if (s === 'mortgage') return 'mortgage';
  if (s === 'auto' || s === 'auto loan') return 'autoLoan';
  if (s === 'student' || s === 'student loan') return 'studentLoan';
  if (s === 'personal' || s === 'personal loan') return 'personalLoan';
  return 'other';
}

function getPlaidClient(): PlaidApi {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;

  if (!clientId || !secret) throw new ConvexError('Plaid credentials are not configured.');

  const config = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  });

  return new PlaidApi(config);
}

async function getActionUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new ConvexError('User not authenticated');
  return identity.subject;
}

// --- Public actions ---

export const createLinkToken = action({
  handler: async (ctx): Promise<string> => {
    const userId = await getActionUserId(ctx);
    const plaidClient = getPlaidClient();
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Ignidash',
      products: [Products.Investments],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    return response.data.link_token;
  },
});

export const exchangePublicToken = action({
  args: {
    publicToken: v.string(),
    institutionName: v.string(),
    institutionId: v.optional(v.string()),
    accounts: v.array(ACCOUNT_VALIDATOR),
  },
  handler: async (ctx, { publicToken, institutionName, institutionId, accounts }) => {
    const userId = await getActionUserId(ctx);
    const plaidClient = getPlaidClient();
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const { access_token: accessToken, item_id: itemId } = exchangeResponse.data;

    const plaidItemId = await ctx.runMutation(internal.plaid_data.storePlaidItem, {
      userId,
      accessToken,
      itemId,
      institutionName,
      institutionId,
      accounts,
    });
    await ctx.runAction(internal.plaid.fetchAndUpsertHoldings, { userId, accessToken, plaidItemId });
  },
});

export const syncPlaidItem = action({
  args: { plaidItemId: v.id('plaidItems') },
  handler: async (ctx, { plaidItemId }) => {
    const userId = await getActionUserId(ctx);
    const item = await ctx.runQuery(internal.plaid_data.getPlaidItemByIdInternal, { plaidItemId });
    if (!item || item.userId !== userId) throw new ConvexError('Plaid item not found.');

    await ctx.runAction(internal.plaid.fetchAndUpsertHoldings, { userId, accessToken: item.accessToken, plaidItemId });
    await ctx.runMutation(internal.plaid_data.updateLastSynced, { plaidItemId });
  },
});

export const deletePlaidItem = action({
  args: { plaidItemId: v.id('plaidItems') },
  handler: async (ctx, { plaidItemId }) => {
    const userId = await getActionUserId(ctx);
    const item = await ctx.runQuery(internal.plaid_data.getPlaidItemByIdInternal, { plaidItemId });
    if (!item || item.userId !== userId) throw new ConvexError('Plaid item not found.');

    try {
      const plaidClient = getPlaidClient();
      await plaidClient.itemRemove({ access_token: item.accessToken });
    } catch (e) {
      console.warn('Failed to remove item from Plaid:', e);
    }

    await ctx.runMutation(internal.plaid_data.removePlaidItem, { userId, plaidItemId, accounts: item.accounts });
  },
});

export const createUpdateLinkToken = action({
  args: { plaidItemId: v.id('plaidItems') },
  handler: async (ctx, { plaidItemId }): Promise<string> => {
    const userId = await getActionUserId(ctx);
    const item = await ctx.runQuery(internal.plaid_data.getPlaidItemByIdInternal, { plaidItemId });
    if (!item || item.userId !== userId) throw new ConvexError('Plaid item not found.');

    const plaidClient = getPlaidClient();
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Ignidash',
      access_token: item.accessToken,
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    return response.data.link_token;
  },
});

export const updatePlaidItemAccounts = action({
  args: {
    plaidItemId: v.id('plaidItems'),
    accounts: v.array(ACCOUNT_VALIDATOR),
  },
  handler: async (ctx, { plaidItemId, accounts }) => {
    const userId = await getActionUserId(ctx);
    const item = await ctx.runQuery(internal.plaid_data.getPlaidItemByIdInternal, { plaidItemId });
    if (!item || item.userId !== userId) throw new ConvexError('Plaid item not found.');

    await ctx.runMutation(internal.plaid_data.updatePlaidItemAccounts, { plaidItemId, accounts });
    await ctx.runAction(internal.plaid.fetchAndUpsertHoldings, { userId, accessToken: item.accessToken, plaidItemId });
    await ctx.runMutation(internal.plaid_data.updateLastSynced, { plaidItemId });
  },
});

// --- Internal actions ---

export const fetchAndUpsertHoldings = internalAction({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    plaidItemId: v.id('plaidItems'),
  },
  handler: async (ctx, { userId, accessToken, plaidItemId }) => {
    const plaidClient = getPlaidClient();

    // accountsGet returns ALL linked accounts (investment + non-investment).
    // investmentsHoldingsGet returns only investment accounts + holdings values.
    const [accountsResponse, holdingsResponse] = await Promise.all([
      plaidClient.accountsGet({ access_token: accessToken }),
      plaidClient.investmentsHoldingsGet({ access_token: accessToken }),
    ]);

    const allAccounts = accountsResponse.data.accounts;
    const { holdings } = holdingsResponse.data;

    // Sum holdings value per account for investment accounts.
    const holdingsValueByAccountId = new Map<string, number>();
    for (const holding of holdings) {
      const current = holdingsValueByAccountId.get(holding.account_id) ?? 0;
      holdingsValueByAccountId.set(holding.account_id, current + (holding.institution_value ?? 0));
    }

    const now = Date.now();
    const assetAccounts = allAccounts.filter((a) => a.type === 'depository' || a.type === 'investment' || a.type === 'other');
    const liabilityAccounts = allAccounts.filter((a) => a.type === 'credit' || a.type === 'loan');

    const assetUpdates = assetAccounts.map((account) => ({
      id: `plaid_${account.account_id}`,
      name: account.official_name ?? account.name,
      value: holdingsValueByAccountId.get(account.account_id) ?? account.balances.current ?? 0,
      updatedAt: now,
      plaidAccountId: account.account_id,
      plaidItemId,
      type: mapPlaidSubtypeToAssetType(account.subtype),
    }));

    const liabilityUpdates = liabilityAccounts.map((account) => ({
      id: `plaid_${account.account_id}`,
      name: account.official_name ?? account.name,
      // current balance for credit = amount owed; for loans = outstanding principal
      balance: account.balances.current ?? 0,
      updatedAt: now,
      plaidAccountId: account.account_id,
      plaidItemId,
      type: mapPlaidSubtypeToLiabilityType(account.subtype),
    }));

    await Promise.all([
      ctx.runMutation(internal.plaid_data.upsertPlaidAssets, { userId, plaidItemId, assets: assetUpdates }),
      ctx.runMutation(internal.plaid_data.upsertPlaidLiabilities, { userId, plaidItemId, liabilities: liabilityUpdates }),
    ]);
  },
});
