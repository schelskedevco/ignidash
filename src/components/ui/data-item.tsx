import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { GripVerticalIcon, LinkIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';

interface DataItemProps {
  id: string;
  index: number;
  name: string | React.ReactNode;
  desc: string | React.ReactNode;
  leftAddOn: string | React.ReactNode;
  disabled?: boolean;
  onDropdownClickEdit: () => void;
  onDropdownClickDelete: () => void;
  onDropdownClickDisable?: () => Promise<void>;
  ref?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  showDragHandle?: boolean;
  colorClassName?: string;
  syncedWithNWTracker?: boolean;
}

export default function DataItem({
  id,
  index,
  name,
  desc,
  leftAddOn,
  disabled = false,
  onDropdownClickEdit,
  onDropdownClickDelete,
  onDropdownClickDisable,
  ref,
  style,
  showDragHandle,
  colorClassName,
  syncedWithNWTracker,
  ...otherProps
}: DataItemProps) {
  return (
    <li key={id} className="col-span-1 flex shadow-md dark:shadow-black/25" ref={ref} style={style}>
      <div
        className={cn(
          'border-foreground/50 flex w-16 shrink-0 items-center justify-center gap-1 border text-xl font-medium text-white',
          colorClassName,
          disabled && 'grayscale',
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
          <div className="flex items-center gap-1.5">
            <h4
              className={cn(
                'text-base font-medium text-stone-900 hover:text-stone-600 dark:text-white dark:hover:text-stone-200',
                disabled && 'line-through'
              )}
            >
              {name}
            </h4>
            {syncedWithNWTracker && (
              <span title="Synced with NW Tracker">
                <LinkIcon className="text-muted-foreground size-3.5 shrink-0" />
              </span>
            )}
          </div>
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
              {onDropdownClickDisable && <DropdownItem onClick={onDropdownClickDisable}>{disabled ? 'Enable' : 'Disable'}</DropdownItem>}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </li>
  );
}
