import { ConvexError } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';

const MAX_SNAPSHOTS = 10;

async function savePlanSnapshot(ctx: MutationCtx, planId: Id<'plans'>): Promise<void> {
  const plan = await ctx.db.get(planId);
  if (!plan) throw new ConvexError('Plan not found');

  const { _id, _creationTime, userId, name: _name, isDefault: _isDefault, ...planData } = plan;
  await ctx.db.insert('planSnapshots', { planId, userId, ...planData });

  const snapshots = await ctx.db
    .query('planSnapshots')
    .withIndex('by_planId', (q) => q.eq('planId', planId))
    .order('desc')
    .collect();

  // Delete oldest snapshots if exceeding MAX_SNAPSHOTS
  if (snapshots.length > MAX_SNAPSHOTS) await Promise.all(snapshots.slice(MAX_SNAPSHOTS).map((s) => ctx.db.delete(s._id)));
}

export async function patchPlanWithSnapshot(ctx: MutationCtx, planId: Id<'plans'>, patch: Partial<Doc<'plans'>>): Promise<void> {
  await savePlanSnapshot(ctx, planId);
  await ctx.db.patch(planId, patch);
}

export async function deleteAllSnapshotsForPlan(ctx: MutationCtx, planId: Id<'plans'>): Promise<void> {
  const snapshots = await ctx.db
    .query('planSnapshots')
    .withIndex('by_planId', (q) => q.eq('planId', planId))
    .collect();

  await Promise.all(snapshots.map((s) => ctx.db.delete(s._id)));
}

export async function deleteAllSnapshotsForUser(ctx: MutationCtx, userId: string): Promise<void> {
  const snapshots = await ctx.db
    .query('planSnapshots')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .collect();

  await Promise.all(snapshots.map((s) => ctx.db.delete(s._id)));
}
