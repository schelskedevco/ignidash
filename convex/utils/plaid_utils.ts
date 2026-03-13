import type { MutationCtx } from '../_generated/server';

export async function deletePlaidItemsForUser(ctx: MutationCtx, userId: string): Promise<void> {
  const items = await ctx.db
    .query('plaidItems')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .collect();
  await Promise.all(items.map((item) => ctx.db.delete(item._id)));
}
