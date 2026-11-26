/** Detects clicks inside or outside a referenced element for interaction tracking. */
import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

export function useClickDetection<T extends HTMLElement = HTMLDivElement>(
  onOutside: () => void,
  onInside: () => void
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  // Effect events always see the latest callbacks, so the document listeners are bound once
  // instead of being re-attached whenever a caller passes new inline functions.
  const handleInteraction = useEffectEvent((event: MouseEvent | TouchEvent) => {
    const element = ref.current;
    if (!element) return;

    if (element.contains(event.target as Node)) {
      onInside();
    } else {
      onOutside();
    }
  });

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => handleInteraction(event);

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchend', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchend', listener);
    };
  }, []);

  return ref;
}
