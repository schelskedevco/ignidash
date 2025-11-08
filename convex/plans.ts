import { v } from 'convex/values';
import { query } from './_generated/server';

import { getUserIdOrThrow } from './utils/auth-utils';

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
