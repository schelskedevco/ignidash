import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { timelineValidator } from './validators/timeline_validator';
import { getUserIdOrThrow } from './utils/auth_utils';
import { getPlanForUserIdOrThrow } from './utils/plan_utils';

export const get = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    const plan = await getPlanForUserIdOrThrow(ctx, planId, userId);

    return plan.timeline;
  },
});

export const update = mutation({
  args: {
    planId: v.id('plans'),
    timeline: timelineValidator,
  },
  handler: async (ctx, { planId, timeline }) => {
    const { userId } = await getUserIdOrThrow(ctx);
    await getPlanForUserIdOrThrow(ctx, planId, userId);

    await ctx.db.patch(planId, { timeline });
  },
});
