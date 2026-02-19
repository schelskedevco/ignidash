import { useMemo } from 'react';

export function useAlreadySyncedIds<T extends { id: string }>(
  items: Record<string, T>,
  syncIdKey: keyof T & string,
  excludeItemId?: string
): Set<string> {
  return useMemo(
    () =>
      new Set(
        Object.values(items)
          .filter((item) => item[syncIdKey] && item.id !== excludeItemId)
          .map((item) => item[syncIdKey] as string)
      ),
    [items, syncIdKey, excludeItemId]
  );
}
