import type { Doc } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { getAllPlansForUser } from './plan_utils';

function mapWithChanges<T>(items: T[], predicate: (item: T) => boolean, transform: (item: T) => T): { changed: boolean; items: T[] } {
  let changed = false;

  const mapped = items.map((item) => {
    if (predicate(item)) {
      changed = true;
      return transform(item);
    }
    return item;
  });

  return { changed, items: mapped };
}

async function applyPlanUpdates(
  ctx: MutationCtx,
  userId: string,
  buildPatch: (plan: Doc<'plans'>) => Record<string, unknown>
): Promise<void> {
  const plans = await getAllPlansForUser(ctx, userId);
  const patches: Promise<void>[] = [];

  for (const plan of plans) {
    const patch = buildPatch(plan);
    if (Object.keys(patch).length > 0) {
      patches.push(ctx.db.patch(plan._id, patch));
    }
  }

  await Promise.all(patches);
}

/**
 * When a NW Tracker asset is updated, sync its balance/value/name to all linked simulator accounts and physical assets.
 */
export async function syncAssetToPlans(ctx: MutationCtx, userId: string, asset: Doc<'finances'>['assets'][number]): Promise<void> {
  await applyPlanUpdates(ctx, userId, (plan) => {
    const patch: Record<string, unknown> = {};

    const accounts = mapWithChanges(
      plan.accounts,
      (acc) => acc.syncedFinanceId === asset.id,
      (acc) => ({ ...acc, balance: asset.value, name: asset.name })
    );
    if (accounts.changed) patch.accounts = accounts.items;

    if (plan.physicalAssets) {
      const pa = mapWithChanges(
        plan.physicalAssets,
        (p) => p.syncedAssetId === asset.id,
        (p) => ({ ...p, marketValue: asset.value, name: asset.name })
      );
      if (pa.changed) patch.physicalAssets = pa.items;
    }

    return patch;
  });
}

/**
 * When a NW Tracker asset is deleted, unlink it from all simulator accounts and physical assets (but keep them).
 */
export async function unsyncAssetFromPlans(ctx: MutationCtx, userId: string, assetId: string): Promise<void> {
  await applyPlanUpdates(ctx, userId, (plan) => {
    const patch: Record<string, unknown> = {};

    const accounts = mapWithChanges(
      plan.accounts,
      (acc) => acc.syncedFinanceId === assetId,
      ({ syncedFinanceId: _, ...rest }) => rest
    );
    if (accounts.changed) patch.accounts = accounts.items;

    if (plan.physicalAssets) {
      const pa = mapWithChanges(
        plan.physicalAssets,
        (p) => p.syncedAssetId === assetId,
        ({ syncedAssetId: _, ...rest }) => rest
      );
      if (pa.changed) patch.physicalAssets = pa.items;
    }

    return patch;
  });
}

/**
 * When a NW Tracker liability is updated, sync its balance to all linked simulator debts and physical asset loans.
 */
export async function syncLiabilityToPlans(
  ctx: MutationCtx,
  userId: string,
  liability: Doc<'finances'>['liabilities'][number]
): Promise<void> {
  await applyPlanUpdates(ctx, userId, (plan) => {
    const patch: Record<string, unknown> = {};

    if (plan.debts) {
      const debts = mapWithChanges(
        plan.debts,
        (d) => d.syncedFinanceId === liability.id,
        (d) => ({ ...d, balance: liability.balance, name: liability.name })
      );
      if (debts.changed) patch.debts = debts.items;
    }

    if (plan.physicalAssets) {
      const pa = mapWithChanges(
        plan.physicalAssets,
        (p) => p.syncedLiabilityId === liability.id && p.paymentMethod.type === 'loan',
        (p) => ({ ...p, paymentMethod: { ...p.paymentMethod, loanBalance: liability.balance } })
      );
      if (pa.changed) patch.physicalAssets = pa.items;
    }

    return patch;
  });
}

/**
 * When a NW Tracker liability is deleted, unlink it from all simulator debts and physical assets (but keep them).
 */
export async function unsyncLiabilityFromPlans(ctx: MutationCtx, userId: string, liabilityId: string): Promise<void> {
  await applyPlanUpdates(ctx, userId, (plan) => {
    const patch: Record<string, unknown> = {};

    if (plan.debts) {
      const debts = mapWithChanges(
        plan.debts,
        (d) => d.syncedFinanceId === liabilityId,
        ({ syncedFinanceId: _, ...rest }) => rest
      );
      if (debts.changed) patch.debts = debts.items;
    }

    if (plan.physicalAssets) {
      const pa = mapWithChanges(
        plan.physicalAssets,
        (p) => p.syncedLiabilityId === liabilityId,
        ({ syncedLiabilityId: _, ...rest }) => rest
      );
      if (pa.changed) patch.physicalAssets = pa.items;
    }

    return patch;
  });
}

/**
 * When all NW Tracker assets are deleted, unlink all synced accounts and physical assets across all plans.
 */
export async function unsyncAllAssetsFromPlans(ctx: MutationCtx, userId: string): Promise<void> {
  await applyPlanUpdates(ctx, userId, (plan) => {
    const patch: Record<string, unknown> = {};

    const accounts = mapWithChanges(
      plan.accounts,
      (acc) => !!acc.syncedFinanceId,
      ({ syncedFinanceId: _, ...rest }) => rest
    );
    if (accounts.changed) patch.accounts = accounts.items;

    if (plan.physicalAssets) {
      const pa = mapWithChanges(
        plan.physicalAssets,
        (p) => !!p.syncedAssetId,
        ({ syncedAssetId: _, ...rest }) => rest
      );
      if (pa.changed) patch.physicalAssets = pa.items;
    }

    return patch;
  });
}

/**
 * When all NW Tracker liabilities are deleted, unlink all synced debts and physical asset liabilities across all plans.
 */
export async function unsyncAllLiabilitiesFromPlans(ctx: MutationCtx, userId: string): Promise<void> {
  await applyPlanUpdates(ctx, userId, (plan) => {
    const patch: Record<string, unknown> = {};

    if (plan.debts) {
      const debts = mapWithChanges(
        plan.debts,
        (d) => !!d.syncedFinanceId,
        ({ syncedFinanceId: _, ...rest }) => rest
      );
      if (debts.changed) patch.debts = debts.items;
    }

    if (plan.physicalAssets) {
      const pa = mapWithChanges(
        plan.physicalAssets,
        (p) => !!p.syncedLiabilityId,
        ({ syncedLiabilityId: _, ...rest }) => rest
      );
      if (pa.changed) patch.physicalAssets = pa.items;
    }

    return patch;
  });
}
