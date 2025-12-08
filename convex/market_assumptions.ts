import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { marketAssumptionsValidator } from './validators/market_assumptions_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const get = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.marketAssumptions;
  },
});

export const update = mutation({
  args: {
    planId: v.id('plans'),
    marketAssumptions: marketAssumptionsValidator,
  },
  handler: async (ctx, { planId, marketAssumptions }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    await ctx.db.patch(planId, { marketAssumptions });
  },
});
