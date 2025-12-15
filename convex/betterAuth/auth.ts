import { getStaticAuth } from '@convex-dev/better-auth';
import { doc } from 'convex-helpers/validators';
import { v } from 'convex/values';

import schema from './schema';
import { query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { createAuth } from '../auth';

export const auth = getStaticAuth(createAuth);

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

export const getIsAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return false;

    const user = await ctx.db.get(identity.subject as Id<'user'>);
    return user?.role === 'admin';
  },
});
