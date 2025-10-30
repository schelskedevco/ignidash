import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  removeInternalPadding?: boolean;
}

export default function Card({ children, className, removeInternalPadding = false }: CardProps) {
  const internalCardPadding = removeInternalPadding ? 'p-0' : 'px-4 py-5 sm:p-6';

  return (
    <div
      className={cn(
        'bg-emphasized-background border-border/50 @container/card my-2 overflow-hidden border shadow-sm dark:shadow-black/50',
        className
      )}
    >
      <div className={cn('h-full', internalCardPadding)}>{children}</div>
    </div>
  );
}
