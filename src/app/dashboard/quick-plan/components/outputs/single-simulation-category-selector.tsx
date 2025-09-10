'use client';

import { cn } from '@/lib/utils';

export enum SingleSimulationCategory {
  Portfolio = 'Portfolio',
  CashFlow = 'Cash Flow',
  Taxes = 'Taxes',
  Returns = 'Returns',
  Contributions = 'Contributions',
  Withdrawals = 'Withdrawals',
}

interface SingleSimulationCategorySelectorProps {
  className?: string;
  setCurrentCategory: (category: SingleSimulationCategory) => void;
  currentCategory: SingleSimulationCategory;
}

export default function SingleSimulationCategorySelector({
  className,
  setCurrentCategory,
  currentCategory,
}: SingleSimulationCategorySelectorProps) {
  return (
    <div className={cn('isolate -ml-1 flex gap-x-2 overflow-x-auto py-2 pl-1', className)}>
      {Object.values(SingleSimulationCategory).map((category) => (
        <button
          key={category}
          onClick={() => setCurrentCategory(category)}
          type="button"
          className={cn(
            'text-muted-foreground bg-background hover:bg-emphasized-background focus-outline border-border relative inline-flex items-center rounded-full border px-3 py-2 text-sm font-semibold focus:z-10',
            { 'text-foreground bg-emphasized-background': currentCategory === category }
          )}
        >
          <span className="whitespace-nowrap">{category}</span>
        </button>
      ))}
    </div>
  );
}
