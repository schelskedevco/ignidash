'use client';

import { cn } from '@/lib/utils';

export enum ChartsCategory {
  Portfolio = 'Portfolio',
  CashFlow = 'Cash Flow',
  Phases = 'Phases',
  Returns = 'Returns',
  Withdrawals = 'Withdrawals',
}

interface ChartsCategorySelectorProps {
  className?: string;
  setCurrentCategory: (category: ChartsCategory) => void;
  currentCategory: ChartsCategory;
}

export default function ChartsCategorySelector({ className, setCurrentCategory, currentCategory }: ChartsCategorySelectorProps) {
  return (
    <div className={cn('isolate -ml-1 flex gap-x-1 overflow-x-auto py-2 pl-1', className)}>
      {Object.values(ChartsCategory).map((category) => (
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
