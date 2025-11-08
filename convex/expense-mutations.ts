import { v } from 'convex/values';
import { mutation } from './_generated/server';

import { expenseValidator } from './validators/expenses-validator';
import { getUserIdOrThrow } from './utils/auth-utils';
import { getPlanForUserIdOrThrow } from './utils/plan-utils';

export const upsertExpense = mutation({
  args: {
    planId: v.id('plans'),
    expense: expenseValidator,
  },
  handler: async (ctx, { planId, expense }) => {
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const updatedExpenses = [...plan.expenses.filter((e) => e.id !== expense.id), expense];

    await ctx.db.patch(planId, { expenses: updatedExpenses });
  },
});

export const deleteExpense = mutation({
  args: {
    planId: v.id('plans'),
    expenseId: v.string(),
  },
  handler: async (ctx, { planId, expenseId }) => {
    const userId = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const updatedExpenses = plan.expenses.filter((exp) => exp.id !== expenseId);

    await ctx.db.patch(planId, { expenses: updatedExpenses });
  },
});
