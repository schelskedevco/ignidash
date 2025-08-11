'use client';

import { useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface UseDrawerHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  drawerName?: string;
}

export function useDrawerHistory({ isOpen, onClose, drawerName = 'drawer' }: UseDrawerHistoryProps) {
  const isMobile = useIsMobile();

  const handlePopState = useCallback(
    (event: PopStateEvent) => {
      if (event.state?.drawer === drawerName && !isOpen) {
        return;
      }

      if (isOpen && (!event.state || event.state.drawer !== drawerName)) {
        onClose();
      }
    },
    [isOpen, onClose, drawerName]
  );

  useEffect(() => {
    if (!isMobile) return;

    if (isOpen) {
      const state = { drawer: drawerName };
      window.history.pushState(state, '', window.location.href);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, isMobile, handlePopState, drawerName]);

  useEffect(() => {
    if (!isMobile || !isOpen) return;

    return () => {
      if (window.history.state?.drawer === drawerName) {
        window.history.back();
      }
    };
  }, [isOpen, isMobile, drawerName]);
}
