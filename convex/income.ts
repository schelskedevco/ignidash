import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { incomeValidator } from './validators/incomes_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const getIncomes = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.incomes;
  },
});

export const getCountOfIncomes = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.incomes.length;
  },
});

export const getIncome = query({
  args: { planId: v.id('plans'), incomeId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, incomeId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

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
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const existingIndex = plan.incomes.findIndex((inc) => inc.id === income.id);
    if (existingIndex === -1 && plan.incomes.length >= 10) throw new ConvexError('Maximum of 10 incomes reached.');

    const updatedIncomes =
      existingIndex !== -1 ? plan.incomes.map((inc, index) => (index === existingIndex ? income : inc)) : [...plan.incomes, income];

    await ctx.db.patch(planId, { incomes: updatedIncomes });
  },
});

export const deleteIncome = mutation({
  args: {
    planId: v.id('plans'),
    incomeId: v.string(),
  },
  handler: async (ctx, { planId, incomeId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

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
