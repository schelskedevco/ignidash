'use client';

import { PresentationChartLineIcon } from '@heroicons/react/24/outline';

import IconButton from '@/components/ui/icon-button';
import ColumnHeader from '@/components/ui/column-header';
import { useRegenSimulation } from '@/hooks/use-regen-simulation';

export default function ResultsColumnHeader() {
  const { icon, label, handleClick, className } = useRegenSimulation();

  return (
    <ColumnHeader
      title="Results"
      icon={PresentationChartLineIcon}
      iconButton={<IconButton icon={icon} label={label} onClick={handleClick} className={className} />}
    />
  );
}
