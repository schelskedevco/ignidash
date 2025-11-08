import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { authComponent } from './auth';

import { incomeValidator } from './validators/incomes-validator';

export const upsertIncome = mutation({
  args: {
    planId: v.id('plans'),
    income: incomeValidator,
  },
  handler: async (ctx, { planId, income }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

    const updatedIncomes = [...plan.incomes.filter((i) => i.id !== income.id), income];

    await ctx.db.patch(planId, { incomes: updatedIncomes });
  },
});

export const deleteIncome = mutation({
  args: {
    planId: v.id('plans'),
    incomeId: v.string(),
  },
  handler: async (ctx, { planId, incomeId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

    const updatedContributionRules = plan.contributionRules.map((rule) => {
      if (rule.incomeIds?.includes(incomeId)) {
        return { ...rule, incomeIds: rule.incomeIds.filter((id) => id !== incomeId) };
      }
      return rule;
    });

    const updatedIncomes = plan.incomes.filter((inc) => inc.id !== incomeId);

    await ctx.db.patch(planId, { incomes: updatedIncomes, contributionRules: updatedContributionRules });
  },
});
