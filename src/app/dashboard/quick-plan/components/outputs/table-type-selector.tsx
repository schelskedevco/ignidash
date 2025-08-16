'use client';

import { cn } from '@/lib/utils';

export enum TableType {
  AllSimulations = 'Simulations',
  YearlyResults = 'Yearly Results',
}

interface TableTypeSelectorProps {
  className?: string;
  setCurrentType: (type: TableType) => void;
  currentType: TableType;
}

export default function TableTypeSelector({ className, setCurrentType, currentType }: TableTypeSelectorProps) {
  return (
    <div className={cn('isolate -ml-1 flex gap-x-1 overflow-x-auto py-2 pl-1', className)}>
      {Object.values(TableType).map((type) => (
        <button
          key={type}
          onClick={() => setCurrentType(type)}
          type="button"
          className={cn(
            'text-muted-foreground bg-background hover:bg-emphasized-background focus-outline border-border relative inline-flex items-center rounded-full border px-3 py-2 text-sm font-semibold focus:z-10',
            { 'text-foreground bg-emphasized-background': currentType === type }
          )}
        >
          <span className="whitespace-nowrap">{type}</span>
        </button>
      ))}
    </div>
  );
}
