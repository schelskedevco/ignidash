import { useCallback } from 'react';
import { flushSync } from 'react-dom';

/**
 * Returns a wrapper function that preserves scroll position across state updates.
 * Handles both window scrolling (mobile) and fixed container scrolling (desktop xl+).
 */
export function useScrollPreservation() {
  return useCallback(<TArgs extends unknown[]>(fn: (...args: TArgs) => void) => {
    return (...args: TArgs) => {
      const mainElement = document.querySelector('main');
      const useMainAsScrollContainer = mainElement && getComputedStyle(mainElement).overflowY === 'auto';
      const scrollTop = useMainAsScrollContainer ? mainElement.scrollTop : window.scrollY;

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const html = document.documentElement;
      const originalScrollBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';

      flushSync(() => {
        fn(...args);
      });

      if (useMainAsScrollContainer) {
        mainElement.scrollTop = scrollTop;
      } else {
        window.scrollTo(0, scrollTop);
      }

      html.style.scrollBehavior = originalScrollBehavior;
    };
  }, []);
}
