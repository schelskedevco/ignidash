import { mutation } from './_generated/server';
import { authComponent } from './auth';

/**
 * Create a default plan for a new user
 * This should be called when a user first signs up or first accesses the app
 */
export const initDefaultPlan = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    const userId = user?.userId;
    const userName = user?.name || 'Anonymous';

    if (!userId) throw new Error('User not authenticated');

    const existingPlan = await ctx.db
      .query('plans')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();
    if (existingPlan) return;

    await ctx.db.insert('plans', {
      userId,
      name: `${userName}'s Plan`,
      timeline: null,
      incomes: [],
      expenses: [],
      accounts: [],
      contributionRules: [],
      baseContributionRule: { type: 'save' },
      marketAssumptions: { stockReturn: 10, stockYield: 3.5, bondReturn: 5, bondYield: 4.5, cashReturn: 3, inflationRate: 3 },
    });
  },
});
