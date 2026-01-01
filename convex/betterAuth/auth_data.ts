import { doc } from 'convex-helpers/validators';
import { v } from 'convex/values';

import schema from './schema';
import { query } from './_generated/server';
import type { Id } from './_generated/dataModel';

export const getCurrentUserSafe = query({
  args: {},
  returns: v.union(v.null(), doc(schema, 'user')),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;

    const userId = identity.subject as Id<'user'>;
    return ctx.db.get(userId);
  },
});

export const listSubscriptions = query({
  args: {},
  returns: v.union(v.null(), v.array(doc(schema, 'subscription'))),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;

    return await ctx.db
      .query('subscription')
      .filter((q) => q.eq(q.field('referenceId'), identity.subject as Id<'user'>))
      .collect();
  },
});

export const getCanUseAIFeatures = query({
  args: {},
  returns: v.object({
    canUseAIFeatures: v.boolean(),
    isAdmin: v.boolean(),
    isActiveSubscription: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return { canUseAIFeatures: false, isAdmin: false, isActiveSubscription: false };

    const [user, subscriptions] = await Promise.all([
      ctx.db.get(identity.subject as Id<'user'>),
      ctx.db
        .query('subscription')
        .filter((q) => q.eq(q.field('referenceId'), identity.subject as Id<'user'>))
        .collect(),
    ]);

    const isAdmin = user?.role === 'admin';
    const isActiveSubscription = subscriptions?.some(
      (subscription) => subscription.status === 'active' || subscription.status === 'trialing'
    );

    return { canUseAIFeatures: isAdmin || isActiveSubscription, isAdmin, isActiveSubscription };
  },
});
