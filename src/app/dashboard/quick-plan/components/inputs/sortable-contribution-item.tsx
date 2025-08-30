import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ContributionItem from './contribution-item';

interface SortableContributionItemProps {
  id: string;
  index: number;
  name: string | React.ReactNode;
  desc: string | React.ReactNode;
  leftAddOnCharacter: string;
  onDropdownClickEdit: () => void;
  onDropdownClickDelete: () => void;
}

export default function SortableContributionItem(props: SortableContributionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return <ContributionItem ref={setNodeRef} style={style} {...attributes} {...listeners} {...props} />;
}
