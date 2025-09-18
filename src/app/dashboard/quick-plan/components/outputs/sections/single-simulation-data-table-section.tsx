'use client';

import { useState, memo } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { SingleSimulationCategory } from '@/lib/types/single-simulation-category';
import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';

import SingleSimulationDataTable from '../tables/single-simulation-data-table';
import TableTypeSelector, { TableType } from '../table-type-selector';

interface DrillDownBreadcrumbProps {
  selectedSeed: number | null;
  setSelectedSeed: (seed: number | null) => void;
}

function DrillDownBreadcrumb({ selectedSeed, setSelectedSeed }: DrillDownBreadcrumbProps) {
  const withScrollPreservation = useScrollPreservation();

  return (
    <nav aria-label="Breadcrumb" className="flex">
      <ol role="list" className="flex items-center space-x-2">
        <li>
          <div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus-outline"
              onClick={withScrollPreservation(() => setSelectedSeed(null))}
            >
              <span>All Simulations</span>
            </button>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0" />
            <span className="ml-2">{`Simulation #${selectedSeed}`}</span>
          </div>
        </li>
      </ol>
    </nav>
  );
}

interface SingleSimulationDataTableSectionProps {
  simulation: SimulationResult;
  currentCategory: SingleSimulationCategory;
}

function SingleSimulationDataTableSection({ simulation, currentCategory }: SingleSimulationDataTableSectionProps) {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [currentTableType, setCurrentTableType] = useState<TableType>(TableType.AllSimulations);

  let headerText: string | React.ReactNode;
  let headerDesc: string;

  if (selectedSeed !== null) {
    headerText = <DrillDownBreadcrumb selectedSeed={selectedSeed} setSelectedSeed={setSelectedSeed} />;
    headerDesc = 'Year-by-year progression and outcome for this simulation.';
  } else if (currentTableType === TableType.YearlyResults) {
    headerText = 'Yearly Results';
    headerDesc = 'View aggregated statistics across all simulations by year.';
  } else {
    headerText = 'All Simulations';
    headerDesc = 'Browse all simulation runs. Select one to explore further.';
  }

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader title={headerText} desc={headerDesc} className="mb-4" />
      <TableTypeSelector currentType={currentTableType} setCurrentType={setCurrentTableType} />
      <SingleSimulationDataTable simulation={simulation} currentCategory={currentCategory} />
    </SectionContainer>
  );
}

export default memo(SingleSimulationDataTableSection);
