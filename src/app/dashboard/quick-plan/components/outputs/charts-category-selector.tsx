'use client';

import { cn } from '@/lib/utils';

export enum ChartsCategory {
  Portfolio = 'Portfolio',
  CashFlow = 'Cash Flow',
  Phases = 'Phases',
  Returns = 'Returns',
  Withdrawals = 'Withdrawals',

  //   Portfolio2 = 'Portfolio2',
  //   CashFlow2 = 'Cash Flow2',
  //   Phases2 = 'Phases2',
  //   Returns2 = 'Returns2',
  //   Withdrawals2 = 'Withdrawals2  ',
}

interface ChartsCategorySelectorProps {
  className?: string;
  onCategoryChange: (category: ChartsCategory) => void;
  currentCategory: ChartsCategory;
}

export default function ChartsCategorySelector({ className, onCategoryChange, currentCategory }: ChartsCategorySelectorProps) {
  return (
    <div className={cn('isolate flex overflow-x-auto pb-2', className)}>
      {Object.values(ChartsCategory).map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          type="button"
          className={cn(
            'text-muted-foreground bg-background hover:bg-emphasized-background focus-outline relative m-1 inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold focus:z-10',
            { 'text-foreground bg-emphasized-background': currentCategory === category }
          )}
        >
          <span className="whitespace-nowrap">{category}</span>
        </button>
      ))}
    </div>
  );
}
