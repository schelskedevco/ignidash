'use client';

import { useState, memo } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';

import { Button } from '@/components/catalyst/button';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import type { AggregateSimulationStats } from '@/lib/calc/simulation-analyzer';

import MonteCarloDataTable from '../tables/monte-carlo-data-table';
import HistoricalBacktestDataTable from '../tables/historical-backtest-data-table';
import TableTypeSelector, { TableType } from '../table-type-selector';

interface StochasticDataTableSectionProps {
  simulationType: 'monteCarlo' | 'historicalBacktest';
  simStats: AggregateSimulationStats;
}

function StochasticDataTableSection({ simulationType, simStats }: StochasticDataTableSectionProps) {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [currentTableType, setCurrentTableType] = useState<TableType>(TableType.AllSimulations);

  let headerText: string;
  let headerDesc: string;

  if (selectedSeed !== null) {
    headerText = `Simulation #${selectedSeed} Details`;
    headerDesc = 'Year-by-year progression and outcome for this specific simulation.';
  } else if (currentTableType === TableType.YearlyResults) {
    headerText = 'Yearly Results';
    headerDesc = 'Aggregated statistics across all simulations by year.';
  } else {
    headerText = 'Simulations Table';
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
      <SectionHeader title={headerText} desc={headerDesc} />
      {selectedSeed !== null ? (
        <Button disabled={selectedSeed === null} onClick={() => setSelectedSeed(null)} plain>
          <ChevronLeftIcon className="h-5 w-5" />
          <span>Return</span>
        </Button>
      ) : (
        <TableTypeSelector currentType={currentTableType} setCurrentType={setCurrentTableType} />
      )}
      {tableComponent}
    </SectionContainer>
  );
}

// Memoize to prevent re-renders when simulationType hasn't changed
export default memo(StochasticDataTableSection);
