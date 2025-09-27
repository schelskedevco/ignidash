'use client';

import { ListFilterIcon, CheckIcon, ArrowUpDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SimulationCategory } from '@/lib/types/simulation-category';
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
  DropdownLabel,
  DropdownHeader,
  DropdownDivider,
} from '@/components/catalyst/dropdown';
import { useMonteCarloSortMode, useUpdateMonteCarloSortMode } from '@/lib/stores/quick-plan-store';
import { formatChartString } from '@/lib/utils';

interface SimulationCategorySelectorProps {
  className?: string;
  setCurrentCategory: (category: SimulationCategory) => void;
  currentCategory: SimulationCategory;
  setCurrentPercentile?: (percentile: 'P10' | 'P25' | 'P50' | 'P75' | 'P90') => void;
  currentPercentile?: 'P10' | 'P25' | 'P50' | 'P75' | 'P90';
  selectedSeed?: number | null;
}

export default function SimulationCategorySelector({
  className,
  setCurrentCategory,
  currentCategory,
  setCurrentPercentile,
  currentPercentile,
  selectedSeed,
}: SimulationCategorySelectorProps) {
  const percentiles = ['P10', 'P25', 'P50', 'P75', 'P90'] as const;
  const sortModeOptions = ['retirementAge', 'bankruptcyAge', 'finalPortfolioValue', 'averageStockReturn'] as const;

  const monteCarloSortMode = useMonteCarloSortMode();
  const updateMonteCarloSortMode = useUpdateMonteCarloSortMode();

  return (
    <div className="flex items-center justify-between">
      <div className={cn('isolate -ml-1 flex gap-x-2 overflow-x-auto px-1 py-2', className)}>
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
        <div className="border-border/50 flex shrink-0 border-l sm:gap-1.5 sm:px-2">
          <Dropdown>
            <DropdownButton plain aria-label="Open sort mode options" disabled={!!selectedSeed}>
              <ArrowUpDownIcon />
            </DropdownButton>
            <DropdownMenu>
              <DropdownHeader>
                <div className="pr-6 text-sm/7 font-semibold">Sort Simulations By</div>
              </DropdownHeader>
              <DropdownDivider />
              {sortModeOptions.map((sortMode) => (
                <DropdownItem key={sortMode} onClick={() => updateMonteCarloSortMode(sortMode)}>
                  <CheckIcon data-slot="icon" className={cn({ invisible: monteCarloSortMode !== sortMode })} />
                  <DropdownLabel>{formatChartString(sortMode)}</DropdownLabel>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownButton plain aria-label="Open options" disabled={!!selectedSeed}>
              <ListFilterIcon />
            </DropdownButton>
            <DropdownMenu>
              {percentiles.map((percentile) => (
                <DropdownItem key={percentile} onClick={() => setCurrentPercentile(percentile)}>
                  <CheckIcon data-slot="icon" className={cn({ invisible: currentPercentile !== percentile })} />
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
