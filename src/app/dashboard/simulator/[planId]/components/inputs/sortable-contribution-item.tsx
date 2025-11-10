import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ContributionItem from './contribution-item';

interface SortableContributionItemProps {
  id: string;
  index: number;
  name: string | React.ReactNode;
  desc: string | React.ReactNode;
  leftAddOn: string | React.ReactNode;
  disabled?: boolean;
  onDropdownClickEdit: () => void;
  onDropdownClickDelete: () => void;
  onDropdownClickDisable?: () => Promise<void>;
  colorClassName?: string;
}

export default function SortableContributionItem(props: SortableContributionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return <ContributionItem ref={setNodeRef} style={style} {...attributes} {...listeners} {...props} />;
}
