import { useMemo } from 'react';

export function useChartInterval(dataLength: number, desiredTicks = 12) {
  return useMemo(() => {
    if (dataLength <= desiredTicks) return 0;
    return Math.ceil(dataLength / desiredTicks) - 1;
  }, [dataLength, desiredTicks]);
}
