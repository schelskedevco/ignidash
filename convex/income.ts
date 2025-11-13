import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { incomeValidator } from './validators/incomes_validator';
import { getUserIdOrThrow } from './utils/auth_utils';
import { getPlanForUserIdOrThrow } from './utils/plan_utils';

export const getIncomes = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    return plan.incomes;
  },
});

export const getCountOfIncomes = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    return plan.incomes.length;
  },
});

export const getIncome = query({
  args: { planId: v.id('plans'), incomeId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, incomeId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const income = plan.incomes.find((inc) => inc.id === incomeId);
    return income || null;
  },
});

export const upsertIncome = mutation({
  args: {
    planId: v.id('plans'),
    income: incomeValidator,
  },
  handler: async (ctx, { planId, income }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const existingIndex = plan.incomes.findIndex((i) => i.id === income.id);
    const updatedIncomes =
      existingIndex !== -1 ? plan.incomes.map((i, index) => (index === existingIndex ? income : i)) : [...plan.incomes, income];

    await ctx.db.patch(planId, { incomes: updatedIncomes });
  },
});

export const deleteIncome = mutation({
  args: {
    planId: v.id('plans'),
    incomeId: v.string(),
  },
  handler: async (ctx, { planId, incomeId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

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
