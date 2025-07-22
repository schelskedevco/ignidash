'use client';

import { PresentationChartLineIcon } from '@heroicons/react/24/outline';

import IconButton from '@/components/ui/icon-button';
import ColumnHeader from '@/components/ui/column-header';
import { useLinkSharing } from '@/hooks/use-link-sharing';

export default function ResultsColumnHeader() {
  const { icon, label, handleLinkClick } = useLinkSharing();

  return (
    <ColumnHeader
      title="Results"
      icon={PresentationChartLineIcon}
      iconButton={<IconButton icon={icon} label={label} onClick={handleLinkClick} />}
    />
  );
}
