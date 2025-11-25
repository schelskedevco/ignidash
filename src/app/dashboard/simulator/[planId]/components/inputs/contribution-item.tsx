import React, { forwardRef } from 'react';

import DataItem from '@/components/ui/data-item';

interface ContributionItemProps {
  id: string;
  index: number;
  name: string | React.ReactNode;
  desc: string | React.ReactNode;
  leftAddOn: string | React.ReactNode;
  disabled?: boolean;
  onDropdownClickEdit: () => void;
  onDropdownClickDelete: () => void;
  onDropdownClickDisable?: () => Promise<void>;
  style?: React.CSSProperties;
  colorClassName?: string;
}

export const ContributionItem = forwardRef<HTMLLIElement, ContributionItemProps>(({ id, ...props }, ref) => {
  return <DataItem id={id} {...props} ref={ref} showDragHandle />;
});

ContributionItem.displayName = 'ContributionItem';

export default ContributionItem;
