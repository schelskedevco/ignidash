import { v } from 'convex/values';
import { mutation, internalMutation } from './_generated/server';

import { getUserIdOrThrow } from './utils/auth_utils';
import { deleteAllPlansForUser } from './utils/plan_utils';
import { deleteFinancesForUser } from './utils/finances_utils';
import { deleteAllConversationsForUser } from './utils/conversation_utils';
import { deleteAllInsightsForUser } from './utils/insights_utils';

export const deleteAppData = mutation({
  args: {
    shouldCreateBlankPlan: v.boolean(),
  },
  handler: async (ctx, { shouldCreateBlankPlan }) => {
    const { userId, userName } = await getUserIdOrThrow(ctx);

    await Promise.all([deleteAllConversationsForUser(ctx, userId), deleteAllInsightsForUser(ctx, userId)]);
    await Promise.all([deleteAllPlansForUser(ctx, userId), deleteFinancesForUser(ctx, userId)]);

    if (shouldCreateBlankPlan) {
      await ctx.db.insert('plans', {
        userId,
        name: `${userName}'s Plan`,
        isDefault: false,
        timeline: null,
        incomes: [],
        expenses: [],
        debts: [],
        physicalAssets: [],
        accounts: [],
        contributionRules: [],
        baseContributionRule: { type: 'save' },
        marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
        taxSettings: { filingStatus: 'single' },
        privacySettings: { isPrivate: true },
        simulationSettings: { simulationSeed: 9521, simulationMode: 'fixedReturns' },
      });
    }
  },
});

export const deleteAppDataForUser = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    await Promise.all([deleteAllConversationsForUser(ctx, userId), deleteAllInsightsForUser(ctx, userId)]);
    await Promise.all([deleteAllPlansForUser(ctx, userId), deleteFinancesForUser(ctx, userId)]);
  },
});
