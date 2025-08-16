'use client';

import { useState, memo } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import type { AggregateSimulationStats } from '@/lib/calc/simulation-analyzer';
import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';

import MonteCarloDataTable from '../tables/monte-carlo-data-table';
import HistoricalBacktestDataTable from '../tables/historical-backtest-data-table';
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
            <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
            <span className="ml-2">{`Simulation #${selectedSeed}`}</span>
          </div>
        </li>
      </ol>
    </nav>
  );
}

interface StochasticDataTableSectionProps {
  simulationType: 'monteCarlo' | 'historicalBacktest';
  simStats: AggregateSimulationStats;
}

function StochasticDataTableSection({ simulationType, simStats }: StochasticDataTableSectionProps) {
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

  let tableComponent;
  switch (simulationType) {
    case 'monteCarlo':
      tableComponent = (
        <MonteCarloDataTable
          simStats={simStats}
          selectedSeed={selectedSeed}
          setSelectedSeed={setSelectedSeed}
          currentTableType={currentTableType}
        />
      );
      break;
    case 'historicalBacktest':
      tableComponent = (
        <HistoricalBacktestDataTable
          simStats={simStats}
          selectedSeed={selectedSeed}
          setSelectedSeed={setSelectedSeed}
          currentTableType={currentTableType}
        />
      );
      break;
  }

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader title={headerText} desc={headerDesc} className="mb-4" />
      <TableTypeSelector currentType={currentTableType} setCurrentType={setCurrentTableType} />
      {tableComponent}
    </SectionContainer>
  );
}

// Memoize to prevent re-renders when simulationType hasn't changed
export default memo(StochasticDataTableSection);
