import { useMemo } from 'react';

interface FinanceItem {
  id: string;
  type: string;
}

/**
 * Filters NW Tracker finance items to those linkable from a simulator dialog.
 * Excludes items already synced by other plan items (pass their IDs via `alreadySyncedIds`).
 */
export function useLinkableFinances<T extends FinanceItem>(
  items: T[] | null | undefined,
  alreadySyncedIds: Set<string>,
  typeFilter: string[]
): T[] {
  return useMemo(
    () =>
      items?.filter((item) => {
        if (alreadySyncedIds.has(item.id)) return false;
        if (!typeFilter.includes(item.type)) return false;
        return true;
      }) ?? [],
    [items, alreadySyncedIds, typeFilter]
  );
}
