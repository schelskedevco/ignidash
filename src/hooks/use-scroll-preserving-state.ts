import { useCallback } from 'react';
import { flushSync } from 'react-dom';

export function useScrollPreservation() {
  return useCallback(<TArgs extends unknown[]>(fn: (...args: TArgs) => void) => {
    return (...args: TArgs) => {
      const scrollY = window.scrollY;

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      flushSync(() => {
        fn(...args);
      });

      window.scrollTo(0, scrollY);
    };
  }, []);
}
