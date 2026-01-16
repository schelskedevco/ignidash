import { query, mutation } from './_generated/server';

import { getUserIdOrThrow } from './utils/auth_utils';

export const get = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const onboarding = await ctx.db
      .query('onboarding')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();

    return onboarding?.onboardingDialogCompleted ?? false;
  },
});

export const update = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getUserIdOrThrow(ctx);

    const onboarding = await ctx.db
      .query('onboarding')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();

    const updateData = { onboardingDialogCompleted: true };
    if (onboarding) await ctx.db.patch(onboarding._id, updateData);
    else await ctx.db.insert('onboarding', { userId, ...updateData });
  },
});
