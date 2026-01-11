import { useMemo } from 'react';
import { useChartTimeFrameToShow, useMonteCarloTimeFrameToShow } from '@/lib/stores/simulator-store';

export function useChartDataSlice<T>(data: T[], timeFrameType: 'single' | 'monteCarlo'): T[] {
  const chartTimeFrameToShow = useChartTimeFrameToShow();
  const monteCarloTimeFrameToShow = useMonteCarloTimeFrameToShow();

  const timeFrameToShow = timeFrameType === 'single' ? chartTimeFrameToShow : monteCarloTimeFrameToShow;

  return useMemo(() => {
    switch (timeFrameToShow) {
      case 'tenYears':
        return data.slice(0, 10);
      case 'twentyYears':
        return data.slice(0, 20);
      case 'thirtyYears':
        return data.slice(0, 30);
      case 'fullPlan':
        return data;
      default:
        return data;
    }
  }, [data, timeFrameToShow]);
}
