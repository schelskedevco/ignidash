import { useCallback } from 'react';
import { flushSync } from 'react-dom';

/**
 * Returns a wrapper function that preserves scroll position across state updates.
 * Handles both window scrolling (mobile) and fixed container scrolling (desktop).
 */
export function useScrollPreservation() {
  return useCallback(<TArgs extends unknown[]>(fn: (...args: TArgs) => void) => {
    return (...args: TArgs) => {
      const scrollContainer = document.querySelector('main');
      const scrollTop = scrollContainer?.scrollTop ?? window.scrollY;

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      flushSync(() => {
        fn(...args);
      });

      if (scrollContainer) {
        scrollContainer.scrollTop = scrollTop;
      } else {
        window.scrollTo(0, scrollTop);
      }
    };
  }, []);
}
