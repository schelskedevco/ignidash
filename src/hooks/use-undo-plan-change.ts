import { useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

import { useSelectedPlanId } from './use-selected-plan-id';

export function useUndoPlanChange() {
  const planId = useSelectedPlanId();

  const numSnapshots = useQuery(api.plan_snapshots.getCountOfSnapshots, { planId });
  const canUndo = (numSnapshots ?? 0) > 0;

  const undoMutation = useMutation(api.plan_snapshots.undo);
  const handleUndo = useCallback(() => {
    if (canUndo) undoMutation({ planId });
  }, [canUndo, undoMutation, planId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const el = document.activeElement;
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable)) {
          return;
        }

        e.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  return { canUndo, handleUndo };
}
