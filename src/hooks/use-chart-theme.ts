import { useMemo } from 'react';
import { useTheme } from 'next-themes';

export function useChartTheme() {
  const { resolvedTheme } = useTheme();

  return useMemo(
    () => ({
      gridColor: resolvedTheme === 'dark' ? '#44403c' : '#d6d3d1', // stone-700 : stone-300
      foregroundColor: resolvedTheme === 'dark' ? '#f5f5f4' : '#1c1917', // stone-100 : stone-900
      backgroundColor: resolvedTheme === 'dark' ? '#292524' : '#ffffff', // stone-800 : white
      foregroundMutedColor: resolvedTheme === 'dark' ? '#d6d3d1' : '#57534e', // stone-300 : stone-600
    }),
    [resolvedTheme]
  );
}
