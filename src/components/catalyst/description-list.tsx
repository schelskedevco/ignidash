import clsx from 'clsx';

export function DescriptionList({ className, ...props }: React.ComponentPropsWithoutRef<'dl'>) {
  return (
    <dl {...props} className={clsx(className, 'grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,--spacing(80))_auto] sm:text-sm/6')} />
  );
}

export function DescriptionTerm({ className, ...props }: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <dt
      {...props}
      className={clsx(className, 'border-border/25 col-start-1 border-t pt-3 text-stone-500 first:border-none sm:py-3 dark:text-stone-400')}
    />
  );
}

export function DescriptionDetails({ className, ...props }: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <dd
      {...props}
      className={clsx(className, 'sm:border-border/25 pt-1 pb-3 text-stone-950 sm:border-t sm:py-3 sm:nth-2:border-none dark:text-white')}
    />
  );
}
