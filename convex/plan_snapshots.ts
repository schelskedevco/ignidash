import { v, ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';

import { getPlanForCurrentUserOrThrow } from './utils/plan_utils';

export const getCountOfSnapshots = query({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    const snapshots = await ctx.db
      .query('planSnapshots')
      .withIndex('by_planId', (q) => q.eq('planId', planId))
      .collect();

    return snapshots.length;
  },
});

export const undo = mutation({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    await getPlanForCurrentUserOrThrow(ctx, planId);

    const newestSnapshot = await ctx.db
      .query('planSnapshots')
      .withIndex('by_planId', (q) => q.eq('planId', planId))
      .order('desc')
      .first();

    if (!newestSnapshot) throw new ConvexError('No snapshots available for undo');

    // Restore plan data from snapshot
    const { _id, _creationTime, planId: _, userId: _u, ...planData } = newestSnapshot;
    await ctx.db.patch(planId, planData);

    // Delete the used snapshot
    await ctx.db.delete(_id);
  },
});
