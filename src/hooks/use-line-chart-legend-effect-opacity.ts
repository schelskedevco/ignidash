import { useState, useRef, useEffect } from 'react';

export function useLineChartLegendEffectOpacity() {
  const [hoveringDataKey, setHoveringDataKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getOpacity = (dataKey: string) => (hoveringDataKey === null ? 1 : dataKey === hoveringDataKey ? 1 : 0);

  const handleMouseEnter = (dataKey: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setHoveringDataKey(dataKey);
    }, 50);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setHoveringDataKey(null);
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { getOpacity, handleMouseEnter, handleMouseLeave };
}
