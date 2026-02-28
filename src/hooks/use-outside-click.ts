/** Detects clicks inside or outside a referenced element for interaction tracking. */
import { useEffect, useRef, type RefObject } from 'react';

export function useClickDetection<T extends HTMLElement = HTMLDivElement>(
  onOutside: () => void,
  onInside: () => void
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;

    const handleInteraction = (event: MouseEvent | TouchEvent) => {
      if (!element) return;

      if (element.contains(event.target as Node)) {
        onInside();
      } else {
        onOutside();
      }
    };

    document.addEventListener('mousedown', handleInteraction);
    document.addEventListener('touchend', handleInteraction);

    return () => {
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
    };
  }, [onOutside, onInside]);

  return ref;
}
