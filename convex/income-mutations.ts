import { v } from 'convex/values';
import { mutation } from './_generated/server';

import { incomeValidator } from './validators/incomes-validator';
import { getUserIdOrThrow } from './utils/auth-utils';
import { getPlanForUserIdOrThrow } from './utils/plan-utils';

export const upsertIncome = mutation({
  args: {
    planId: v.id('plans'),
    income: incomeValidator,
  },
  handler: async (ctx, { planId, income }) => {
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

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
    const userId = await getUserIdOrThrow(ctx);
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
