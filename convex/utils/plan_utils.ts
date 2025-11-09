import { QueryCtx } from '../_generated/server';
import { Id, Doc } from '../_generated/dataModel';

export async function getPlanForUserIdOrThrow(ctx: QueryCtx, planId: Id<'plans'>, userId: string): Promise<Doc<'plans'>> {
  const plan = await ctx.db.get(planId);

  if (!plan) throw new Error('Plan not found');
  if (plan.userId !== userId) throw new Error('Not authorized to update this plan');

  return plan;
}
