import * as Headless from '@headlessui/react';
import { cn } from '@/lib/utils';
import type React from 'react';

export function Fieldset({ className, ...props }: { className?: string } & Omit<Headless.FieldsetProps, 'as' | 'className'>) {
  return <Headless.Fieldset {...props} className={cn('*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6', className)} />;
}

export function Legend({ className, ...props }: { className?: string } & Omit<Headless.LegendProps, 'as' | 'className'>) {
  return (
    <Headless.Legend
      data-slot="legend"
      {...props}
      className={cn('text-xl/6 font-semibold text-zinc-950 data-disabled:opacity-50 sm:text-lg/6 dark:text-white', className)}
    />
  );
}

export function FieldGroup({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div data-slot="control" {...props} className={cn('space-y-4', className)} />;
}

export function Field({ className, ...props }: { className?: string } & Omit<Headless.FieldProps, 'as' | 'className'>) {
  return (
    <Headless.Field
      {...props}
      className={cn(
        '[&>[data-slot=label]+[data-slot=control]]:mt-1',
        '[&>[data-slot=label]+[data-slot=description]]:mt-1',
        '[&>[data-slot=description]+[data-slot=control]]:mt-3',
        '[&>[data-slot=control]+[data-slot=description]]:mt-2',
        '[&>[data-slot=control]+[data-slot=error]]:mt-2',
        '*:data-[slot=label]:font-medium',
        className
      )}
    />
  );
}

export function Label({ className, ...props }: { className?: string } & Omit<Headless.LabelProps, 'as' | 'className'>) {
  return (
    <Headless.Label
      data-slot="label"
      {...props}
      className={cn('text-base/6 text-zinc-950 select-none data-disabled:opacity-50 sm:text-sm/6 dark:text-white', className)}
    />
  );
}

export function Description({ className, ...props }: { className?: string } & Omit<Headless.DescriptionProps, 'as' | 'className'>) {
  return (
    <Headless.Description
      data-slot="description"
      {...props}
      className={cn('text-base/6 text-zinc-500 data-disabled:opacity-50 sm:text-sm/6 dark:text-zinc-400', className)}
    />
  );
}

export function ErrorMessage({ className, ...props }: { className?: string } & Omit<Headless.DescriptionProps, 'as' | 'className'>) {
  return (
    <Headless.Description
      data-slot="error"
      {...props}
      className={cn('text-base/6 text-red-600 data-disabled:opacity-50 sm:text-sm/6 dark:text-red-500', className)}
    />
  );
}
