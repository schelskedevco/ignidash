import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { getUserIdOrThrow } from './utils/auth-utils';
import { getPlanForUserIdOrThrow } from './utils/plan-utils';

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);

    const plans = await ctx.db
      .query('plans')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();

    return plans;
  },
});

export const getPlanById = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const userId = await getUserIdOrThrow(ctx);

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to access this plan');

    return plan;
  },
});

export const createBlankPlan = mutation({
  args: { newPlanName: v.string() },
  handler: async (ctx, { newPlanName }) => {
    const userId = await getUserIdOrThrow(ctx);

    return await ctx.db.insert('plans', {
      userId,
      name: newPlanName,
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

export const cloneExistingPlan = mutation({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const { timeline, incomes, expenses, accounts, contributionRules, baseContributionRule, marketAssumptions } = plan;
    const clonedData = {
      timeline: structuredClone(timeline),
      incomes: structuredClone(incomes),
      expenses: structuredClone(expenses),
      accounts: structuredClone(accounts),
      contributionRules: structuredClone(contributionRules),
      baseContributionRule: structuredClone(baseContributionRule),
      marketAssumptions: structuredClone(marketAssumptions),
    };

    return await ctx.db.insert('plans', { userId, name: `${plan.name} (Copy)`, ...clonedData });
  },
});

export const deletePlan = mutation({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const userId = await getUserIdOrThrow(ctx);
    await getPlanForUserIdOrThrow(ctx, planId, userId);

    await ctx.db.delete(planId);
  },
});

export const updatePlanName = mutation({
  args: { planId: v.id('plans'), name: v.string() },
  handler: async (ctx, { planId, name }) => {
    const userId = await getUserIdOrThrow(ctx);
    await getPlanForUserIdOrThrow(ctx, planId, userId);

    await ctx.db.patch(planId, { name });
  },
});
