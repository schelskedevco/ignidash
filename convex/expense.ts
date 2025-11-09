import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { expenseValidator } from './validators/expenses_validator';
import { getUserIdOrThrow } from './utils/auth_utils';
import { getPlanForUserIdOrThrow } from './utils/plan_utils';

export const getExpenses = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    return plan.expenses;
  },
});

export const getExpense = query({
  args: { planId: v.id('plans'), expenseId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, expenseId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const expense = plan.expenses.find((exp) => exp.id === expenseId);
    return expense || null;
  },
});

export const upsertExpense = mutation({
  args: {
    planId: v.id('plans'),
    expense: expenseValidator,
  },
  handler: async (ctx, { planId, expense }) => {
    const { userId } = await getUserIdOrThrow(ctx);
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
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    const updatedExpenses = plan.expenses.filter((exp) => exp.id !== expenseId);

    await ctx.db.patch(planId, { expenses: updatedExpenses });
  },
});
