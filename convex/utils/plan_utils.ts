import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id, Doc } from '../_generated/dataModel';

export async function getPlanForCurrentUserOrThrow(ctx: QueryCtx, planId: Id<'plans'>): Promise<Doc<'plans'>> {
  const [identity, plan] = await Promise.all([ctx.auth.getUserIdentity(), ctx.db.get(planId)]);

  const userId = identity?.subject;

  if (!plan) throw new ConvexError('Plan not found');
  if (plan.userId !== userId) throw new ConvexError('Not authorized to access this plan');

  return plan;
}

export async function getAllPlansForUser(ctx: QueryCtx, userId: string): Promise<Doc<'plans'>[]> {
  return await ctx.db
    .query('plans')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .collect();
}

export async function deleteAllPlansForUser(ctx: MutationCtx, userId: string): Promise<void> {
  const plans = await getAllPlansForUser(ctx, userId);
  for (const plan of plans) {
    await ctx.db.delete(plan._id);
  }
}
