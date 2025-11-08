import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { authComponent } from './auth';

export const createBlankPlan = mutation({
  args: { newPlanName: v.string() },
  handler: async (ctx, { newPlanName }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

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
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to clone this plan');

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

export const updatePlanName = mutation({
  args: { planId: v.id('plans'), name: v.string() },
  handler: async (ctx, { planId, name }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

    await ctx.db.patch(planId, { name });
  },
});

export const deletePlan = mutation({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to delete this plan');

    await ctx.db.delete(planId);
  },
});

export const updatePlanTimeline = mutation({
  args: {
    planId: v.id('plans'),
    timeline: v.object({
      currentAge: v.number(),
      lifeExpectancy: v.number(),
      retirementStrategy: v.union(
        v.object({ type: v.literal('fixedAge'), retirementAge: v.number() }),
        v.object({ type: v.literal('swrTarget'), safeWithdrawalRate: v.number() })
      ),
    }),
  },
  handler: async (ctx, { planId, timeline }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

    await ctx.db.patch(planId, { timeline });
  },
});
