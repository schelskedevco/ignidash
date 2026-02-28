/** Selected-age state for simulation results with minimum constraint. */
import { useCallback, useState } from 'react';

export function useResultsState(startAge: number) {
  const minSelectableAge = Math.floor(startAge) + 1;
  const [selectedAge, setSelectedAge] = useState<number>(minSelectableAge);

  const onAgeSelect = useCallback(
    (age: number) => {
      if (age >= minSelectableAge) setSelectedAge(age);
    },
    [minSelectableAge]
  );

  return { selectedAge, onAgeSelect };
}
