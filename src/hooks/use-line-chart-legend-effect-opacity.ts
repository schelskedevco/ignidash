import { useState } from 'react';

export function useLineChartLegendEffectOpacity() {
  const [hoveringDataKey, setHoveringDataKey] = useState<string | null>(null);

  const getOpacity = (dataKey: string) => (hoveringDataKey === null ? 1 : dataKey === hoveringDataKey ? 1 : 0);
  const handleMouseEnter = (dataKey: string) => setHoveringDataKey(dataKey);
  const handleMouseLeave = () => setHoveringDataKey(null);

  return { getOpacity, handleMouseEnter, handleMouseLeave };
}
