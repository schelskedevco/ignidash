/** Generic ref to the previous value of a state variable. */
import { useEffect, useRef, type RefObject } from 'react';

export const usePrevious = <T>(value: T): RefObject<T | undefined> => {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};
