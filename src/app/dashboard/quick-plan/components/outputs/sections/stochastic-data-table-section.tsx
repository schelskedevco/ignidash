'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, TableCellsIcon, CalendarDaysIcon } from '@heroicons/react/20/solid';

import { Button } from '@/components/catalyst/button';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import ButtonGroup from '@/components/ui/button-group';
import type { MultiSimulationResult } from '@/lib/calc/simulation-engine';

import MonteCarloDataTable from '../tables/monte-carlo-data-table';
import HistoricalBacktestDataTable from '../tables/historical-backtest-data-table';

interface StochasticDataTableSectionProps {
  simulation: MultiSimulationResult;
  simulationType: 'monteCarlo' | 'historicalBacktest';
}

export default function StochasticDataTableSection({ simulation, simulationType }: StochasticDataTableSectionProps) {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'yearly'>('all');

  // Reset selectedSeed when simulation changes
  useEffect(() => setSelectedSeed(null), [simulation, viewMode]);

  let headerText: string;
  let headerDesc: string;

  if (selectedSeed !== null) {
    headerText = `Simulation #${selectedSeed} Details`;
    headerDesc = 'Year-by-year progression and outcome for this specific simulation.';
  } else if (viewMode === 'yearly') {
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
        <MonteCarloDataTable simulation={simulation} selectedSeed={selectedSeed} setSelectedSeed={setSelectedSeed} viewMode={viewMode} />
      );
      break;
    case 'historicalBacktest':
      tableComponent = (
        <HistoricalBacktestDataTable
          simulation={simulation}
          selectedSeed={selectedSeed}
          setSelectedSeed={setSelectedSeed}
          viewMode={viewMode}
        />
      );
      break;
  }

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader
        title={headerText}
        desc={headerDesc}
        rightAddOn={
          selectedSeed !== null ? (
            <Button disabled={selectedSeed === null} onClick={() => setSelectedSeed(null)} plain>
              <ChevronLeftIcon className="h-5 w-5" />
              <span>Return</span>
            </Button>
          ) : (
            <ButtonGroup
              firstButtonText="Simulations"
              firstButtonIcon={<TableCellsIcon />}
              firstButtonOnClick={() => setViewMode('all')}
              lastButtonText="Yearly results"
              lastButtonIcon={<CalendarDaysIcon />}
              lastButtonOnClick={() => setViewMode('yearly')}
              defaultActiveButton="first"
            />
          )
        }
      />
      {tableComponent}
    </SectionContainer>
  );
}
