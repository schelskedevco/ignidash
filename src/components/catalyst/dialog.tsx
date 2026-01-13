import {
  DialogBackdrop,
  DialogPanel,
  Dialog as HeadlessDialog,
  type DialogProps,
  DialogTitle as HeadlessDialogTitle,
  type DialogTitleProps,
  Description,
  type DescriptionProps,
} from '@headlessui/react';
import type React from 'react';
import { Text } from './text';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const sizes = {
  xs: 'sm:max-w-xs',
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
};

export function Dialog({
  size = 'lg',
  className,
  children,
  ...props
}: { size?: keyof typeof sizes; className?: string; children: React.ReactNode } & Omit<DialogProps, 'as' | 'className'>) {
  return (
    <HeadlessDialog {...props} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 flex w-screen justify-center overflow-y-auto bg-stone-100/75 px-2 py-2 transition duration-100 focus:outline-0 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:px-6 sm:py-8 lg:px-8 lg:py-16 dark:bg-stone-900/75"
      />

      <div className="fixed inset-0 w-screen overflow-y-auto pt-6 sm:pt-0">
        <div className="grid min-h-full grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr] sm:p-4">
          <DialogPanel
            transition
            className={cn(
              sizes[size],
              'bg-background ring-border/50 row-start-2 w-full min-w-90 rounded-t-3xl p-(--gutter) shadow-lg ring-1 [--gutter:--spacing(8)] sm:mb-auto sm:rounded-2xl forced-colors:outline',
              'transition duration-100 will-change-transform data-closed:translate-y-12 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:data-closed:translate-y-0 sm:data-closed:data-enter:scale-95',
              className
            )}
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}

export function DialogTitle({
  className,
  children,
  onClose,
  ...props
}: { className?: string; children?: React.ReactNode; onClose: () => void } & Omit<DialogTitleProps, 'as' | 'className'>) {
  return (
    <HeadlessDialogTitle {...props} className={cn('text-foreground text-2xl/6 font-semibold text-balance', className)}>
      <div className="flex items-center justify-between">
        {children}
        <button type="button" onClick={onClose} className="focus-outline hover:text-muted-foreground rounded-md">
          <span className="sr-only">Close panel</span>
          <X aria-hidden="true" className="size-6" />
        </button>
      </div>
    </HeadlessDialogTitle>
  );
}

export function DialogDescription({
  className,
  ...props
}: { className?: string } & Omit<DescriptionProps<typeof Text>, 'as' | 'className'>) {
  return <Description as={Text} {...props} className={cn('mt-2 text-pretty', className)} />;
}

export function DialogBody({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={cn('mt-6', className)} />;
}

export function DialogActions({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cn('mt-6 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:mt-8 sm:flex-row sm:*:w-auto', className)}
    />
  );
}
