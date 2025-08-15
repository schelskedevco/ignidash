import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook to detect clicks inside or outside a referenced element
 *
 * Similar to useOutsideClick but provides both inside and outside detection.
 * Useful for charts that need to track interaction state.
 *
 * @param onOutside - Function to call when a click occurs outside the element
 * @param onInside - Function to call when a click occurs inside the element
 * @returns RefObject to attach to the target element
 */
export function useClickDetection<T extends HTMLElement = HTMLDivElement>(
  onOutside: () => void,
  onInside: () => void
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    // Capture the current ref value to avoid stale closures
    const element = ref.current;

    const handleInteractionStart = (event: MouseEvent | TouchEvent) => {
      if (!element) return;

      if (element.contains(event.target as Node)) {
        // Click is inside the element
        onInside();
      } else {
        // Click is outside the element
        onOutside();
      }
    };

    // Add event listeners to document
    document.addEventListener('mousedown', handleInteractionStart);
    document.addEventListener('touchstart', handleInteractionStart);

    // Cleanup function removes event listeners
    return () => {
      document.removeEventListener('mousedown', handleInteractionStart);
      document.removeEventListener('touchstart', handleInteractionStart);
    };
  }, [onOutside, onInside]); // Include callbacks in dependencies

  return ref;
}
