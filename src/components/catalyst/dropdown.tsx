'use client';

import {
  Menu,
  type MenuProps,
  MenuButton,
  type MenuButtonProps,
  MenuItems,
  type MenuItemsProps,
  MenuItem,
  type MenuItemProps,
  MenuSection,
  type MenuSectionProps,
  MenuHeading,
  type MenuHeadingProps,
  MenuSeparator,
  type MenuSeparatorProps,
  Description,
  type DescriptionProps,
} from '@headlessui/react';
import { cn } from '@/lib/utils';
import type React from 'react';
import { Button } from './button';
import { Link } from './link';

export function Dropdown(props: MenuProps) {
  return <Menu {...props} />;
}

export function DropdownButton<T extends React.ElementType = typeof Button>({
  as = Button,
  ...props
}: { className?: string } & Omit<MenuButtonProps<T>, 'className'>) {
  return <MenuButton as={as} {...props} suppressHydrationWarning />;
}

export function DropdownMenu({
  anchor = 'bottom',
  className,
  ...props
}: { className?: string } & Omit<MenuItemsProps, 'as' | 'className'>) {
  return (
    <MenuItems
      {...props}
      transition
      anchor={anchor}
      className={cn(
        className,
        // Anchor positioning
        '[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(1)] data-[anchor~=end]:[--anchor-offset:6px] data-[anchor~=start]:[--anchor-offset:-6px] sm:data-[anchor~=end]:[--anchor-offset:4px] sm:data-[anchor~=start]:[--anchor-offset:-4px]',
        // Base styles
        'isolate w-max rounded-xl p-1',
        // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
        'outline outline-transparent focus:outline-hidden',
        // Handle scrolling when menu won't fit in viewport
        'overflow-y-auto',
        // Popover background
        'bg-white/75 backdrop-blur-xl dark:bg-stone-800/75',
        // Shadows
        'shadow-lg ring-1 ring-stone-950/10 dark:ring-white/10 dark:ring-inset',
        // Define grid at the menu level if subgrid is supported
        'supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
        // Transitions
        'transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0'
      )}
    />
  );
}

export function DropdownItem({
  className,
  ...props
}: { className?: string } & (Omit<MenuItemProps<'button'>, 'as' | 'className'> | Omit<MenuItemProps<typeof Link>, 'as' | 'className'>)) {
  const classes = cn(
    className,
    // Base styles
    'group cursor-default rounded-lg px-3.5 py-2.5 focus:outline-hidden sm:px-3 sm:py-1.5',
    // Text styles
    'text-left text-base/6 text-stone-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',
    // Focus
    'data-focus:bg-primary data-focus:text-white',
    // Disabled state
    'data-disabled:opacity-50',
    // Forced colors mode
    'forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText] forced-colors:data-focus:*:data-[slot=icon]:text-[HighlightText]',
    // Use subgrid when available but fallback to an explicit grid layout if not
    'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center supports-[grid-template-columns:subgrid]:grid-cols-subgrid',
    // Icons
    '*:data-[slot=icon]:col-start-1 *:data-[slot=icon]:row-start-1 *:data-[slot=icon]:mr-2.5 *:data-[slot=icon]:-ml-0.5 *:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:mr-2 sm:*:data-[slot=icon]:size-4',
    '*:data-[slot=icon]:text-stone-500 data-focus:*:data-[slot=icon]:text-white dark:*:data-[slot=icon]:text-stone-400 dark:data-focus:*:data-[slot=icon]:text-white',
    // Avatar
    '*:data-[slot=avatar]:mr-2.5 *:data-[slot=avatar]:-ml-1 *:data-[slot=avatar]:size-6 sm:*:data-[slot=avatar]:mr-2 sm:*:data-[slot=avatar]:size-5'
  );

  return 'href' in props ? (
    <MenuItem as={Link} {...props} className={classes} />
  ) : (
    <MenuItem as="button" type="button" {...props} className={classes} />
  );
}

export function DropdownHeader({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={cn(className, 'col-span-5 px-3.5 pt-2.5 pb-1 sm:px-3')} />;
}

export function DropdownSection({ className, ...props }: { className?: string } & Omit<MenuSectionProps, 'as' | 'className'>) {
  return (
    <MenuSection
      {...props}
      className={cn(
        className,
        // Define grid at the section level instead of the item level if subgrid is supported
        'col-span-full supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]'
      )}
    />
  );
}

export function DropdownHeading({ className, ...props }: { className?: string } & Omit<MenuHeadingProps, 'as' | 'className'>) {
  return (
    <MenuHeading
      {...props}
      className={cn(
        className,
        'col-span-full grid grid-cols-[1fr_auto] gap-x-12 px-3.5 pt-2 pb-1 text-sm/5 font-medium text-stone-500 sm:px-3 sm:text-xs/5 dark:text-stone-400'
      )}
    />
  );
}

export function DropdownDivider({ className, ...props }: { className?: string } & Omit<MenuSeparatorProps, 'as' | 'className'>) {
  return (
    <MenuSeparator
      {...props}
      className={cn(className, 'bg-border/25 col-span-full mx-3.5 my-1 h-px border-0 sm:mx-3 forced-colors:bg-[CanvasText]')}
    />
  );
}

export function DropdownLabel({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} data-slot="label" className={cn(className, 'col-start-2 row-start-1')} {...props} />;
}

export function DropdownDescription({ className, ...props }: { className?: string } & Omit<DescriptionProps, 'as' | 'className'>) {
  return (
    <Description
      data-slot="description"
      {...props}
      className={cn(
        className,
        'col-span-2 col-start-2 row-start-2 text-sm/5 text-stone-500 group-data-focus:text-white sm:text-xs/5 dark:text-stone-400 forced-colors:group-data-focus:text-[HighlightText]'
      )}
    />
  );
}

export function DropdownShortcut({
  keys,
  className,
  ...props
}: { keys: string | string[]; className?: string } & Omit<DescriptionProps<'kbd'>, 'as' | 'className'>) {
  return (
    <Description as="kbd" {...props} className={cn(className, 'col-start-5 row-start-1 flex justify-self-end')}>
      {(Array.isArray(keys) ? keys : keys.split('')).map((char, index) => (
        <kbd
          key={index}
          className={cn([
            'min-w-[2ch] text-center font-sans text-stone-400 capitalize group-data-focus:text-white forced-colors:group-data-focus:text-[HighlightText]',
            // Make sure key names that are longer than one character (like "Tab") have extra space
            index > 0 && char.length > 1 && 'pl-1',
          ])}
        >
          {char}
        </kbd>
      ))}
    </Description>
  );
}
