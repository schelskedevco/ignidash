import { useMemo, useCallback } from 'react';

import {
  useSelectedSeedFromTable,
  useSelectedSeedFromQuickPercentile,
  useUpdateQuickSelectPercentile,
  useUpdateSelectedSeedFromTable,
} from '@/lib/stores/simulator-store';

export function useActiveSeed() {
  const selectedSeedFromTable = useSelectedSeedFromTable();
  const selectedSeedFromQuickPercentile = useSelectedSeedFromQuickPercentile();

  return useMemo(() => {
    if (selectedSeedFromTable !== null) {
      return { activeSeed: selectedSeedFromTable, activeSeedType: 'table' as const };
    } else if (selectedSeedFromQuickPercentile !== null) {
      return { activeSeed: selectedSeedFromQuickPercentile, activeSeedType: 'percentile' as const };
    } else {
      return { activeSeed: undefined };
    }
  }, [selectedSeedFromTable, selectedSeedFromQuickPercentile]);
}

export function useRemoveActiveSeed() {
  const updateQuickSelectPercentile = useUpdateQuickSelectPercentile();
  const updateSelectedSeedFromTable = useUpdateSelectedSeedFromTable();

  return useCallback(() => {
    updateQuickSelectPercentile(null);
    updateSelectedSeedFromTable(null);
  }, [updateQuickSelectPercentile, updateSelectedSeedFromTable]);
}
