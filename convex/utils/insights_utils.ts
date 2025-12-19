import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id, Doc } from '../_generated/dataModel';

import { getAllPlansForUser } from './plan_utils';

export async function getInsightForCurrentUserOrThrow(ctx: QueryCtx, insightId: Id<'insights'>): Promise<Doc<'insights'>> {
  const [identity, insight] = await Promise.all([ctx.auth.getUserIdentity(), ctx.db.get(insightId)]);

  const userId = identity?.subject;

  if (!insight) throw new ConvexError('Insight not found');
  if (insight.userId !== userId) throw new ConvexError('Not authorized to access this insight');

  return insight;
}

async function getAllInsightsForPlan(ctx: QueryCtx, planId: Id<'plans'>): Promise<Doc<'insights'>[]> {
  return await ctx.db
    .query('insights')
    .withIndex('by_planId_updatedAt', (q) => q.eq('planId', planId))
    .collect();
}

export async function deleteAllInsightsForPlan(ctx: MutationCtx, planId: Id<'plans'>): Promise<void> {
  const insights = await getAllInsightsForPlan(ctx, planId);
  await Promise.all([...insights.map((insight) => ctx.db.delete(insight._id))]);
}

export async function deleteAllInsightsForUser(ctx: MutationCtx, userId: string): Promise<void> {
  const plans = await getAllPlansForUser(ctx, userId);
  await Promise.all(plans.map((plan) => deleteAllInsightsForPlan(ctx, plan._id)));
}
