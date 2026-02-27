/**
 * Utilities for plan export/import — removes dangling synced finance IDs
 * that don't match any finance in the importing user's account.
 */

import type { MutationCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
import { getFinancesForUser } from './finances_utils';

export type PlanData = Omit<Doc<'plans'>, '_id' | '_creationTime' | 'userId'>;

/** Removes synced finance IDs that don't match a valid asset/liability in the importing user's finances. */
export async function removeDanglingSyncIds(ctx: MutationCtx, userId: string, planData: PlanData): Promise<PlanData> {
  const finances = await getFinancesForUser(ctx, userId);

  const assetIds = new Set(finances?.assets.map((a) => a.id) ?? []);
  const liabilityIds = new Set(finances?.liabilities.map((l) => l.id) ?? []);

  const result = { ...planData };

  result.accounts = result.accounts.map((account) => {
    if (account.syncedFinanceId && !assetIds.has(account.syncedFinanceId)) {
      const { syncedFinanceId: _, ...rest } = account;
      return rest;
    }
    return account;
  });

  if (result.debts) {
    result.debts = result.debts.map((debt) => {
      if (debt.syncedFinanceId && !liabilityIds.has(debt.syncedFinanceId)) {
        const { syncedFinanceId: _, ...rest } = debt;
        return rest;
      }
      return debt;
    });
  }

  if (result.physicalAssets) {
    result.physicalAssets = result.physicalAssets.map((asset) => {
      let updated = asset;
      if (updated.syncedAssetId && !assetIds.has(updated.syncedAssetId)) {
        const { syncedAssetId: _, ...rest } = updated;
        updated = rest;
      }
      if (updated.syncedLiabilityId && !liabilityIds.has(updated.syncedLiabilityId)) {
        const { syncedLiabilityId: _, ...rest } = updated;
        updated = rest;
      }
      return updated;
    });
  }

  return result;
}
