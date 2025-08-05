import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  removeInternalPadding?: boolean;
}

export default function Card({ children, className, removeInternalPadding = false }: CardProps) {
  const internalCardPadding = removeInternalPadding ? 'p-0' : 'px-4 py-5 sm:p-6';

  return (
    <div className={cn('bg-emphasized-background border-border my-4 overflow-hidden rounded-lg border shadow-md', className)}>
      <div className={internalCardPadding}>{children}</div>
    </div>
  );
}
