'use client';

import { cn } from '@/lib/utils';
import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';

export enum TableType {
  AllSimulations = 'All Simulations',
  YearlyResults = 'Yearly Results',
}

interface TableTypeSelectorProps {
  className?: string;
  setCurrentType: (type: TableType) => void;
  currentType: TableType;
}

export default function TableTypeSelector({ className, setCurrentType, currentType }: TableTypeSelectorProps) {
  const withScrollPreservation = useScrollPreservation();

  return (
    <div className={cn('isolate -mt-1 -ml-1 flex gap-x-2 overflow-x-auto pt-1 pb-2 pl-1', className)}>
      {Object.values(TableType).map((type) => (
        <button
          key={type}
          onClick={withScrollPreservation(() => setCurrentType(type))}
          type="button"
          className={cn(
            'text-muted-foreground bg-background hover:bg-emphasized-background focus-outline border-border/50 relative inline-flex items-center rounded-full border px-3 py-2 text-sm font-semibold focus:z-10',
            { 'text-foreground bg-emphasized-background': currentType === type }
          )}
        >
          <span className="whitespace-nowrap">{type}</span>
        </button>
      ))}
    </div>
  );
}
