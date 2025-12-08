import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { timelineValidator } from './validators/timeline_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const get = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.timeline;
  },
});

export const update = mutation({
  args: {
    planId: v.id('plans'),
    timeline: timelineValidator,
  },
  handler: async (ctx, { planId, timeline }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    await ctx.db.patch(planId, { timeline });
  },
});
