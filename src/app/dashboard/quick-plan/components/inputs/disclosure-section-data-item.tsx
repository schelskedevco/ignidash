import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { GripVerticalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';

interface DisclosureSectionDataItemProps {
  id: string;
  index: number;
  name: string | React.ReactNode;
  desc: string | React.ReactNode;
  leftAddOn: string | React.ReactNode;
  onDropdownClickEdit: () => void;
  onDropdownClickDelete: () => void;
  ref?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  showDragHandle?: boolean;
  colorClassName?: string;
}

export default function DisclosureSectionDataItem({
  id,
  index,
  name,
  desc,
  leftAddOn,
  onDropdownClickEdit,
  onDropdownClickDelete,
  ref,
  style,
  showDragHandle,
  colorClassName,
  ...otherProps
}: DisclosureSectionDataItemProps) {
  // const needsBgTextColor = ['bg-[var(--chart-1)]'];

  return (
    <li key={id} className="col-span-1 flex shadow-xs dark:shadow-none" ref={ref} style={style}>
      <div
        className={cn(
          'border-foreground/50 flex w-16 shrink-0 items-center justify-center gap-1 border text-xl font-medium text-white',
          colorClassName,
          // needsBgTextColor.includes(color) && 'text-black',
          showDragHandle &&
            'cursor-grab touch-none focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset'
        )}
        {...(showDragHandle ? otherProps : {})}
      >
        {showDragHandle && <GripVerticalIcon className="size-5 shrink-0" />}
        {leftAddOn}
      </div>
      <div className="bg-emphasized-background border-border/50 flex flex-1 items-center justify-between truncate border-t border-r border-b">
        <div className="flex-1 truncate px-4 py-2">
          <h4 className="text-base font-medium text-stone-900 hover:text-stone-600 dark:text-white dark:hover:text-stone-200">{name}</h4>
          <div className="text-muted-foreground text-sm">{desc}</div>
        </div>
        <div className="shrink-0 pr-2">
          <Dropdown>
            <DropdownButton plain aria-label="Open options">
              <EllipsisVerticalIcon />
            </DropdownButton>
            <DropdownMenu portal={false}>
              <DropdownItem onClick={onDropdownClickEdit}>Edit</DropdownItem>
              <DropdownItem onClick={onDropdownClickDelete}>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </li>
  );
}
