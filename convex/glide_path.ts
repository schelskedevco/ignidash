import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

import { glidePathValidator } from './validators/glide_path_validator';
import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const get = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await getPlanForCurrentUserOrThrow(ctx, planId);

    return plan.glidePath;
  },
});

export const update = mutation({
  args: {
    planId: v.id('plans'),
    glidePath: glidePathValidator,
  },
  handler: async (ctx, { planId, glidePath }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    await ctx.db.patch(planId, { glidePath });
  },
});
