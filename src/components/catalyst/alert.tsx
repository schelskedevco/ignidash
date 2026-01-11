import {
  DialogBackdrop,
  DialogPanel,
  Dialog,
  type DialogProps,
  DialogTitle,
  type DialogTitleProps,
  Description,
  type DescriptionProps,
} from '@headlessui/react';
import clsx from 'clsx';
import type React from 'react';
import { Text } from './text';

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

export function Alert({
  size = 'md',
  className,
  children,
  ...props
}: { size?: keyof typeof sizes; className?: string; children: React.ReactNode } & Omit<DialogProps, 'as' | 'className'>) {
  return (
    <Dialog {...props} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 flex w-screen justify-center overflow-y-auto bg-stone-100/75 px-2 py-2 transition duration-100 focus:outline-0 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:px-6 sm:py-8 lg:px-8 lg:py-16 dark:bg-stone-900/75"
      />

      <div className="fixed inset-0 w-screen overflow-y-auto pt-6 sm:pt-0">
        <div className="grid min-h-full grid-rows-[1fr_auto_1fr] justify-items-center p-8 sm:grid-rows-[1fr_auto_3fr] sm:p-4">
          <DialogPanel
            transition
            className={clsx(
              className,
              sizes[size],
              'ring-border/50 bg-background row-start-2 w-full rounded-2xl p-8 shadow-lg ring-1 sm:rounded-2xl sm:p-6 forced-colors:outline',
              'transition duration-100 will-change-transform data-closed:opacity-0 data-enter:ease-out data-closed:data-enter:scale-95 data-leave:ease-in'
            )}
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

export function AlertTitle({ className, ...props }: { className?: string } & Omit<DialogTitleProps, 'as' | 'className'>) {
  return (
    <DialogTitle
      {...props}
      className={clsx(
        className,
        'text-center text-base/6 font-semibold text-balance text-stone-950 sm:text-left sm:text-sm/6 sm:text-wrap dark:text-white'
      )}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: { className?: string } & Omit<DescriptionProps<typeof Text>, 'as' | 'className'>) {
  return <Description as={Text} {...props} className={clsx(className, 'mt-2 text-center text-pretty sm:text-left')} />;
}

export function AlertBody({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx(className, 'mt-4')} />;
}

export function AlertActions({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={clsx(className, 'mt-6 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:mt-4 sm:flex-row sm:*:w-auto')}
    />
  );
}
