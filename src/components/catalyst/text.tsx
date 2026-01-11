import { cn } from '@/lib/utils';
import { Link } from './link';

export function Text({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
  return <p data-slot="text" {...props} className={cn('text-base/6 text-stone-500 sm:text-sm/6 dark:text-stone-400', className)} />;
}

export function TextLink({ className, ...props }: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        'text-stone-950 underline decoration-stone-950/50 data-hover:decoration-stone-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white',
        className
      )}
    />
  );
}

export function Strong({ className, ...props }: React.ComponentPropsWithoutRef<'strong'>) {
  return <strong {...props} className={cn('font-medium text-stone-950 dark:text-white', className)} />;
}

export function Code({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      {...props}
      className={cn(
        'rounded-sm border border-stone-950/10 bg-stone-950/2.5 px-0.5 text-sm font-medium text-stone-950 sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5 dark:text-white',
        className
      )}
    />
  );
}
