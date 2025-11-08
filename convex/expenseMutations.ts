import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { authComponent } from './auth';

import { expenseValidator } from './validators/expenses-validator';

export const upsertExpense = mutation({
  args: {
    planId: v.id('plans'),
    expense: expenseValidator,
  },
  handler: async (ctx, { planId, expense }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

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
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?._id;

    if (!userId) throw new Error('User not authenticated');

    const plan = await ctx.db.get(planId);

    if (!plan) throw new Error('Plan not found');
    if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

    const updatedExpenses = plan.expenses.filter((exp) => exp.id !== expenseId);

    await ctx.db.patch(planId, { expenses: updatedExpenses });
  },
});
