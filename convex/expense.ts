import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { expenseValidator } from './validators/expenses_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const getExpenses = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.expenses;
  },
});

export const getCountOfExpenses = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.expenses.length;
  },
});

export const getExpense = query({
  args: { planId: v.id('plans'), expenseId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, expenseId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

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
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const existingIndex = plan.expenses.findIndex((exp) => exp.id === expense.id);
    if (existingIndex === -1 && plan.expenses.length >= 10) throw new ConvexError('Maximum of 10 expenses reached.');

    const updatedExpenses =
      existingIndex !== -1 ? plan.expenses.map((exp, index) => (index === existingIndex ? expense : exp)) : [...plan.expenses, expense];

    await ctx.db.patch(planId, { expenses: updatedExpenses });
  },
});

export const deleteExpense = mutation({
  args: {
    planId: v.id('plans'),
    expenseId: v.string(),
  },
  handler: async (ctx, { planId, expenseId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const updatedExpenses = plan.expenses.filter((exp) => exp.id !== expenseId);

    await ctx.db.patch(planId, { expenses: updatedExpenses });
  },
});
