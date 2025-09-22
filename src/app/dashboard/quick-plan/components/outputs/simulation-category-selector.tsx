'use client';

import { ListFilterIcon, CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu, DropdownLabel } from '@/components/catalyst/dropdown';

interface SimulationCategorySelectorProps {
  className?: string;
  setCurrentCategory: (category: SimulationCategory) => void;
  currentCategory: SimulationCategory;
  setCurrentPercentile?: (percentile: 'P10' | 'P25' | 'P50' | 'P75' | 'P90') => void;
  currentPercentile?: 'P10' | 'P25' | 'P50' | 'P75' | 'P90';
}

export default function SimulationCategorySelector({
  className,
  setCurrentCategory,
  currentCategory,
  setCurrentPercentile,
  currentPercentile,
}: SimulationCategorySelectorProps) {
  const percentiles = ['P10', 'P25', 'P50', 'P75', 'P90'] as const;

  return (
    <div className="flex items-center justify-between">
      <div className={cn('isolate -ml-1 flex gap-x-2 overflow-x-auto py-2 pl-1', className)}>
        {Object.values(SimulationCategory).map((category) => (
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
      {setCurrentPercentile && currentPercentile && (
        <div className="border-border/50 shrink-0 border-l px-2">
          <Dropdown>
            <DropdownButton plain aria-label="Open options">
              <ListFilterIcon />
            </DropdownButton>
            <DropdownMenu>
              {percentiles.map((percentile) => (
                <DropdownItem key={percentile} onClick={() => setCurrentPercentile(percentile)}>
                  <CheckIcon className={cn({ invisible: currentPercentile !== percentile })} />
                  <DropdownLabel>{percentile}</DropdownLabel>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      )}
    </div>
  );
}
