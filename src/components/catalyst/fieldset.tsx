import {
  Fieldset as HeadlessFieldset,
  type FieldsetProps,
  Legend as HeadlessLegend,
  type LegendProps,
  Field as HeadlessField,
  type FieldProps,
  Label as HeadlessLabel,
  type LabelProps,
  Description as HeadlessDescription,
  type DescriptionProps,
} from '@headlessui/react';
import { cn } from '@/lib/utils';
import type React from 'react';

export function Fieldset({ className, ...props }: { className?: string } & Omit<FieldsetProps, 'as' | 'className'>) {
  return <HeadlessFieldset {...props} className={cn('*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6', className)} />;
}

export function Legend({ className, ...props }: { className?: string } & Omit<LegendProps, 'as' | 'className'>) {
  return (
    <HeadlessLegend
      data-slot="legend"
      {...props}
      className={cn('text-xl/6 font-semibold text-stone-950 data-disabled:opacity-50 sm:text-lg/6 dark:text-white', className)}
    />
  );
}

export function FieldGroup({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div data-slot="control" {...props} className={cn('space-y-4', className)} />;
}

export function Field({ className, ...props }: { className?: string } & Omit<FieldProps, 'as' | 'className'>) {
  return (
    <HeadlessField
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

export function Label({ className, ...props }: { className?: string } & Omit<LabelProps, 'as' | 'className'>) {
  return (
    <HeadlessLabel
      data-slot="label"
      {...props}
      className={cn('text-base/6 text-stone-950 select-none data-disabled:opacity-50 sm:text-sm/6 dark:text-white', className)}
    />
  );
}

export function Description({ className, ...props }: { className?: string } & Omit<DescriptionProps, 'as' | 'className'>) {
  return (
    <HeadlessDescription
      data-slot="description"
      {...props}
      className={cn('text-base/6 text-stone-500 data-disabled:opacity-50 sm:text-sm/6 dark:text-stone-400', className)}
    />
  );
}

export function ErrorMessage({ className, ...props }: { className?: string } & Omit<DescriptionProps, 'as' | 'className'>) {
  return (
    <HeadlessDescription
      data-slot="error"
      {...props}
      className={cn('text-base/6 text-red-600 data-disabled:opacity-50 sm:text-sm/6 dark:text-red-500', className)}
    />
  );
}
