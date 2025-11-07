import { v } from 'convex/values';
import { query } from './_generated/server';
import { authComponent } from './auth';

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

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
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?.userId;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to access this plan');

    return plan;
  },
});
