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
        'bg-emphasized-background border-border @container/card my-2 overflow-hidden rounded-lg border shadow-sm dark:shadow-black/30',
        className
      )}
    >
      <div className={`h-full ${internalCardPadding}`}>{children}</div>
    </div>
  );
}
