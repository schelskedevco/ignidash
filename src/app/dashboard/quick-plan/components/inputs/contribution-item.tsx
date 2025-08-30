import React, { forwardRef } from 'react';

import DisclosureSectionDataItem from './disclosure-section-data-item';

interface ContributionItemProps {
  id: string;
  index: number;
  name: string | React.ReactNode;
  desc: string | React.ReactNode;
  leftAddOnCharacter: string;
  onDropdownClickEdit: () => void;
  onDropdownClickDelete: () => void;
  style?: React.CSSProperties;
}

export const ContributionItem = forwardRef<HTMLLIElement, ContributionItemProps>(({ id, ...props }, ref) => {
  return <DisclosureSectionDataItem id={id} {...props} ref={ref} />;
});

ContributionItem.displayName = 'ContributionItem';

export default ContributionItem;
