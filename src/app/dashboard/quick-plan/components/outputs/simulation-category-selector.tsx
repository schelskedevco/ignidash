'use client';

import { ListFilterIcon, CheckIcon, ArrowUpDownIcon } from 'lucide-react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

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
import { useMonteCarloSortMode, useUpdateMonteCarloSortMode, useQuickSelectPercentile } from '@/lib/stores/quick-plan-store';
import { formatChartString } from '@/lib/utils';
import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';

interface DrillDownBreadcrumbProps {
  removeActiveSeed: () => void;
  activeSeed: number | undefined;
}

function DrillDownBreadcrumb({ removeActiveSeed, activeSeed }: DrillDownBreadcrumbProps) {
  const withScrollPreservation = useScrollPreservation();

  return (
    <nav aria-label="Breadcrumb" className="border-border/50 -mx-2 flex border-t border-dashed py-2 sm:-mx-3 lg:-mx-4 xl:hidden">
      <ol role="list" className="mx-2 flex items-center space-x-2 px-1 sm:mx-3 lg:mx-4">
        <li>
          <div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus-outline"
              onClick={withScrollPreservation(() => removeActiveSeed())}
            >
              <span className="underline underline-offset-2">All Results</span>
            </button>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0" />
            <span className="ml-2 font-semibold">{`Seed #${activeSeed}`}</span>
          </div>
        </li>
      </ol>
    </nav>
  );
}

interface SimulationCategorySelectorProps {
  className?: string;
  availableCategories: SimulationCategory[];
  setCurrentCategory: (category: SimulationCategory) => void;
  currentCategory: SimulationCategory;
  handlePercentileChange?: (percentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null) => void;
  removeActiveSeed?: () => void;
  activeSeed?: number | undefined;
  activeSeedType?: 'table' | 'percentile' | undefined;
}

export default function SimulationCategorySelector({
  className,
  availableCategories,
  setCurrentCategory,
  currentCategory,
  handlePercentileChange,
  removeActiveSeed,
  activeSeed,
  activeSeedType,
}: SimulationCategorySelectorProps) {
  const quickSelectPercentile = useQuickSelectPercentile();
  const percentiles = ['p10', 'p25', 'p50', 'p75', 'p90'] as const;
  const sortModeOptions = [
    'finalPortfolioValue',
    'retirementAge',
    'bankruptcyAge',
    'averageStockReturn',
    'earlyRetirementStockReturn',
  ] as const;

  const monteCarloSortMode = useMonteCarloSortMode();
  const updateMonteCarloSortMode = useUpdateMonteCarloSortMode();

  const withScrollPreservation = useScrollPreservation();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className={cn('isolate -ml-1 flex gap-x-2 overflow-x-auto px-1 py-2', className)}>
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={withScrollPreservation(() => setCurrentCategory(category))}
              type="button"
              className={cn(
                'text-muted-foreground bg-background hover:bg-emphasized-background focus-outline border-border/50 relative inline-flex items-center rounded-full border px-3 py-2 text-sm font-semibold focus:z-10',
                { 'text-foreground bg-emphasized-background': currentCategory === category }
              )}
            >
              <span className="whitespace-nowrap">{category}</span>
            </button>
          ))}
        </div>
        {handlePercentileChange && (
          <div className="border-border/50 flex shrink-0 border-l sm:gap-1.5 sm:px-2">
            <Dropdown>
              <DropdownButton plain aria-label="Open sort mode options" disabled={activeSeedType === 'table'}>
                <ArrowUpDownIcon data-slot="icon" />
              </DropdownButton>
              <DropdownMenu>
                <DropdownHeader>
                  <div className="pr-6 text-sm/7 font-semibold">Quick Select By</div>
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
              <DropdownButton plain aria-label="Open options" disabled={activeSeedType === 'table'}>
                <ListFilterIcon data-slot="icon" />
              </DropdownButton>
              <DropdownMenu>
                <DropdownHeader>
                  <div className="pr-6 text-sm/7 font-semibold">Quick Select Percentile</div>
                </DropdownHeader>
                <DropdownDivider />
                {percentiles.map((percentile) => (
                  <DropdownItem
                    key={percentile}
                    onClick={() => handlePercentileChange(quickSelectPercentile !== percentile ? percentile : null)}
                  >
                    <CheckIcon data-slot="icon" className={cn({ invisible: quickSelectPercentile !== percentile })} />
                    <DropdownLabel className="uppercase">{percentile}</DropdownLabel>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        )}
      </div>
      {removeActiveSeed && activeSeed && <DrillDownBreadcrumb removeActiveSeed={removeActiveSeed} activeSeed={activeSeed} />}
    </div>
  );
}
