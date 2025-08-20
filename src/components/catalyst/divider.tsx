import clsx from 'clsx';

export function Divider({ soft = false, className, ...props }: { soft?: boolean } & React.ComponentPropsWithoutRef<'hr'>) {
  return (
    <hr
      role="presentation"
      {...props}
      className={clsx(className, 'w-full border-t', soft && 'border-border/25', !soft && 'border-border/50')}
    />
  );
}
