import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { debtValidator } from './validators/debt_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const getDebts = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.debts ?? [];
  },
});

export const getCountOfDebts = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return (plan.debts ?? []).length;
  },
});

export const getDebt = query({
  args: { planId: v.id('plans'), debtId: v.union(v.string(), v.null()) },
  handler: async (ctx, { planId, debtId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const debt = (plan.debts ?? []).find((d) => d.id === debtId);
    return debt || null;
  },
});

export const upsertDebt = mutation({
  args: {
    planId: v.id('plans'),
    debt: debtValidator,
  },
  handler: async (ctx, { planId, debt }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);
    const debts = plan.debts ?? [];

    const existingIndex = debts.findIndex((d) => d.id === debt.id);
    if (existingIndex === -1 && debts.length >= 10) throw new ConvexError('Maximum of 10 debts reached.');

    const updatedDebts = existingIndex !== -1 ? debts.map((d, index) => (index === existingIndex ? debt : d)) : [...debts, debt];

    await ctx.db.patch(planId, { debts: updatedDebts });
  },
});

export const deleteDebt = mutation({
  args: {
    planId: v.id('plans'),
    debtId: v.string(),
  },
  handler: async (ctx, { planId, debtId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    const updatedDebts = (plan.debts ?? []).filter((d) => d.id !== debtId);

    await ctx.db.patch(planId, { debts: updatedDebts });
  },
});
