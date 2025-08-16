import { useCallback } from 'react';
import { flushSync } from 'react-dom';

export function useScrollPreservation() {
  return useCallback(<TArgs extends unknown[]>(fn: (...args: TArgs) => void) => {
    return (...args: TArgs) => {
      const scrollY = window.scrollY;

      flushSync(() => {
        fn(...args);
      });

      window.scrollTo(0, scrollY);
    };
  }, []);
}
