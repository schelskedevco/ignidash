import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { GripVerticalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';

interface DisclosureSectionDataItemProps {
  id: string;
  index: number;
  name: string | React.ReactNode;
  desc: string | React.ReactNode;
  leftAddOnCharacter: string;
  leftAddOnColor: string;
  onDropdownClickEdit: () => void;
  onDropdownClickDelete: () => void;
  ref?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  showDragHandle?: boolean;
}

export default function DisclosureSectionDataItem({
  id,
  index,
  name,
  desc,
  leftAddOnCharacter,
  leftAddOnColor,
  onDropdownClickEdit,
  onDropdownClickDelete,
  ref,
  style,
  showDragHandle,
  ...otherProps
}: DisclosureSectionDataItemProps) {
  return (
    <li key={id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none" ref={ref} style={style}>
      <div
        className={cn(
          'border-foreground/50 flex w-16 shrink-0 items-center justify-center gap-1 rounded-l-md border text-xl font-medium text-white',
          leftAddOnColor,
          showDragHandle &&
            'cursor-grab touch-none focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset'
        )}
        {...(showDragHandle ? otherProps : {})}
      >
        {showDragHandle && <GripVerticalIcon className="size-5 shrink-0" />}
        {leftAddOnCharacter}
      </div>
      <div className="bg-emphasized-background border-border flex flex-1 items-center justify-between truncate rounded-r-md border-t border-r border-b">
        <div className="flex-1 truncate px-4 py-2 text-sm">
          <span className="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-200">{name}</span>
          <p className="text-muted-foreground">{desc}</p>
        </div>
        <div className="shrink-0 pr-2">
          <Dropdown>
            <DropdownButton plain aria-label="Open options">
              <EllipsisVerticalIcon />
            </DropdownButton>
            <DropdownMenu>
              <DropdownItem onClick={onDropdownClickEdit}>Edit</DropdownItem>
              <DropdownItem onClick={onDropdownClickDelete}>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </li>
  );
}
