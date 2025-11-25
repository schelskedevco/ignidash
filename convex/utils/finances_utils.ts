import { QueryCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';

export async function getFinancesForUserId(ctx: QueryCtx, userId: string): Promise<Doc<'finances'> | null> {
  return await ctx.db
    .query('finances')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first();
}
