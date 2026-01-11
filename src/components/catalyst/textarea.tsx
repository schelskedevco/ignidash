import { Textarea as HeadlessTextarea, type TextareaProps } from '@headlessui/react';
import clsx from 'clsx';
import React, { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea(
  { className, resizable = true, ...props }: { className?: string; resizable?: boolean } & Omit<TextareaProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLTextAreaElement>
) {
  return (
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
      ])}
    >
      <HeadlessTextarea
        ref={ref}
        {...props}
        className={clsx([
          // Basic layout
          'relative block h-full w-full appearance-none rounded-lg px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          // Typography
          'text-base/6 text-stone-950 placeholder:text-stone-500 sm:text-sm/6 dark:text-white',
          // Border
          'border border-stone-950/25 data-hover:border-stone-950/50 dark:border-white/25 dark:data-hover:border-white/50',
          // Background color
          'bg-transparent dark:bg-white/5',
          // Hide default focus styles
          'focus:outline-hidden',
          // Invalid state
          'data-invalid:border-red-500 data-invalid:data-hover:border-red-500 dark:data-invalid:border-red-600 dark:data-invalid:data-hover:border-red-600',
          // Disabled state
          'disabled:border-stone-950/20 dark:disabled:border-white/15 dark:disabled:bg-white/2.5 dark:data-hover:disabled:border-white/15',
          // Resizable
          resizable ? 'resize-y' : 'resize-none',
        ])}
      />
    </span>
  );
});
