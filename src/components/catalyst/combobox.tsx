'use client';

import {
  Combobox as HeadlessCombobox,
  type ComboboxProps,
  ComboboxOption as HeadlessComboboxOption,
  type ComboboxOptionProps,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
} from '@headlessui/react';
import clsx from 'clsx';
import { useState } from 'react';

export function Combobox<T>({
  options,
  displayValue,
  filter,
  anchor = 'bottom',
  className,
  placeholder,
  autoFocus,
  'aria-label': ariaLabel,
  children,
  ...props
}: {
  options: T[];
  displayValue: (value: T | null) => string | undefined;
  filter?: (value: T, query: string) => boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  'aria-label'?: string;
  children: (value: NonNullable<T>) => React.ReactElement;
} & Omit<ComboboxProps<T, false>, 'as' | 'multiple' | 'children'> & { anchor?: 'top' | 'bottom' }) {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => (filter ? filter(option, query) : displayValue(option)?.toLowerCase().includes(query.toLowerCase())));

  return (
    <HeadlessCombobox {...props} multiple={false} virtual={{ options: filteredOptions }} onClose={() => setQuery('')}>
      <span
        data-slot="control"
        className={clsx([
          className,
          // Basic layout
          'relative block w-full',
          // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
          'before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm',
          // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
          'dark:before:hidden',
          // Focus ring
          'sm:focus-within:after:ring-primary after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset sm:focus-within:after:ring-2',
          // Disabled state
          'has-data-disabled:opacity-50 has-data-disabled:before:bg-stone-950/5 has-data-disabled:before:shadow-none',
          // Invalid state
          'has-data-invalid:before:shadow-red-500/10',
        ])}
      >
        <ComboboxInput
          autoFocus={autoFocus}
          data-slot="control"
          aria-label={ariaLabel}
          displayValue={(option: T) => displayValue(option) ?? ''}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={clsx([
            className,
            // Basic layout
            'relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
            // Horizontal padding
            'pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:pr-[calc(--spacing(9)-1px)] sm:pl-[calc(--spacing(3)-1px)]',
            // Typography
            'text-base/6 text-stone-950 placeholder:text-stone-500 sm:text-sm/6 dark:text-white',
            // Border
            'border border-stone-950/25 data-hover:border-stone-950/50 dark:border-white/25 dark:data-hover:border-white/50',
            // Background color
            'bg-transparent dark:bg-white/5',
            // Hide default focus styles
            'focus:outline-hidden',
            // Invalid state
            'data-invalid:border-red-500 data-invalid:data-hover:border-red-500 dark:data-invalid:border-red-500 dark:data-invalid:data-hover:border-red-500',
            // Disabled state
            'data-disabled:border-stone-950/20 dark:data-disabled:border-white/15 dark:data-disabled:bg-white/2.5 dark:data-hover:data-disabled:border-white/15',
            // System icons
            'dark:scheme-dark',
          ])}
        />
        <ComboboxButton className="group absolute inset-y-0 right-0 flex items-center px-2">
          <svg
            className="size-5 stroke-stone-500 group-data-disabled:stroke-stone-600 group-data-hover:stroke-stone-700 sm:size-4 dark:stroke-stone-400 dark:group-data-hover:stroke-stone-300 forced-colors:stroke-[CanvasText]"
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
          >
            <path d="M5.75 10.75L8 13L10.25 10.75" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.25 5.25L8 3L5.75 5.25" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ComboboxButton>
      </span>
      <ComboboxOptions
        transition
        anchor={anchor}
        className={clsx(
          // Anchor positioning
          '[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(4)] sm:data-[anchor~=start]:[--anchor-offset:-4px]',
          // Base styles,
          'isolate min-w-[calc(var(--input-width))] scroll-py-1 rounded-xl p-1 select-none empty:invisible',
          // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
          'outline outline-transparent focus:outline-hidden',
          // Handle scrolling when menu won't fit in viewport
          'overflow-y-scroll overscroll-contain',
          // Popover background
          'bg-white/75 backdrop-blur-xl dark:bg-stone-800/75',
          // Shadows
          'shadow-lg ring-1 ring-stone-950/10 dark:ring-white/10 dark:ring-inset',
          // Transitions
          'transition-opacity duration-100 ease-in data-closed:data-leave:opacity-0 data-transition:pointer-events-none'
        )}
      >
        {({ option }) => children(option)}
      </ComboboxOptions>
    </HeadlessCombobox>
  );
}

export function ComboboxOption<T>({
  children,
  className,
  ...props
}: { className?: string; children?: React.ReactNode } & Omit<ComboboxOptionProps<'div', T>, 'as' | 'className'>) {
  const sharedClasses = clsx(
    // Base
    'flex min-w-0 items-center',
    // Icons
    '*:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 sm:*:data-[slot=icon]:size-4',
    '*:data-[slot=icon]:text-stone-500 group-data-focus/option:*:data-[slot=icon]:text-white dark:*:data-[slot=icon]:text-stone-400',
    'forced-colors:*:data-[slot=icon]:text-[CanvasText] forced-colors:group-data-focus/option:*:data-[slot=icon]:text-[Canvas]',
    // Avatars
    '*:data-[slot=avatar]:-mx-0.5 *:data-[slot=avatar]:size-6 sm:*:data-[slot=avatar]:size-5'
  );

  return (
    <HeadlessComboboxOption
      {...props}
      className={clsx(
        // Basic layout
        'group/option grid w-full cursor-default grid-cols-[1fr_--spacing(5)] items-baseline gap-x-2 rounded-lg py-2.5 pr-2 pl-3.5 sm:grid-cols-[1fr_--spacing(4)] sm:py-1.5 sm:pr-2 sm:pl-3',
        // Typography
        'text-base/6 text-stone-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',
        // Focus
        'data-focus:bg-primary outline-hidden data-focus:text-white',
        // Forced colors mode
        'forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText]',
        // Disabled
        'data-disabled:opacity-50'
      )}
    >
      <span className={clsx(className, sharedClasses)}>{children}</span>
      <svg
        className="relative col-start-2 hidden size-5 self-center stroke-current group-data-selected/option:inline sm:size-4"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path d="M4 8.5l3 3L12 4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </HeadlessComboboxOption>
  );
}

export function ComboboxLabel({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={clsx(className, 'ml-2.5 truncate first:ml-0 sm:ml-2 sm:first:ml-0')} />;
}

export function ComboboxDescription({ className, children, ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      className={clsx(
        className,
        'flex flex-1 overflow-hidden text-stone-500 group-data-focus/option:text-white before:w-2 before:min-w-0 before:shrink dark:text-stone-400'
      )}
    >
      <span className="flex-1 truncate">{children}</span>
    </span>
  );
}
