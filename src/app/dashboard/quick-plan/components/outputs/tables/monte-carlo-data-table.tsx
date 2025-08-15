'use client';

import { useMemo, useEffect } from 'react';

import {
  useMonteCarloSimulationWithWorker,
  useSingleMonteCarloSimulation,
  useStochasticTableData,
  useSimulationDetailTableData,
  useStochasticYearlyResultsTableData,
} from '@/lib/stores/quick-plan-store';
import type { SimulationTableRow, StochasticTableRow, YearlyAggregateTableRow } from '@/lib/schemas/simulation-table-schema';
import {
  generateStochasticTableColumns,
  generateSimulationTableColumns,
  generateYearlyAggregateTableColumns,
} from '@/lib/utils/table-formatters';
import type { MultiSimulationResult } from '@/lib/calc/simulation-engine';

import Table from './table';

interface MonteCarloDataTableImplProps {
  simulation: MultiSimulationResult;
  selectedSeed: number | null;
  setSelectedSeed: (seed: number | null) => void;
  viewMode: 'all' | 'yearly';
}

function MonteCarloDataTableImpl({ simulation, selectedSeed, setSelectedSeed, viewMode }: MonteCarloDataTableImplProps) {
  const selectedSimulation = useSingleMonteCarloSimulation(selectedSeed);

  const allSimulationData = useStochasticTableData(simulation);
  const yearlyData = useStochasticYearlyResultsTableData(simulation);
  const detailData = useSimulationDetailTableData(selectedSimulation);

  const allSimulationColumns = useMemo(() => generateStochasticTableColumns(), []);
  const yearlyColumns = useMemo(() => generateYearlyAggregateTableColumns(), []);
  const detailDataColumns = useMemo(() => generateSimulationTableColumns(), []);

  const handleRowClick = (row: StochasticTableRow) => setSelectedSeed(row.seed);

  // When viewing a specific simulation detail
  if (selectedSeed !== null) {
    return (
      <Table<SimulationTableRow> columns={detailDataColumns} data={detailData} keyField="year" onEscPressed={() => setSelectedSeed(null)} />
    );
  }

  // When viewing yearly aggregated results
  if (viewMode === 'yearly') {
    return <Table<YearlyAggregateTableRow> columns={yearlyColumns} data={yearlyData} keyField="year" />;
  }

  // Default: viewing all simulations
  return <Table<StochasticTableRow> columns={allSimulationColumns} data={allSimulationData} keyField="seed" onRowClick={handleRowClick} />;
}

interface MonteCarloDataTableProps {
  selectedSeed: number | null;
  setSelectedSeed: (seed: number | null) => void;
  viewMode: 'all' | 'yearly';
}

export default function MonteCarloDataTable({ selectedSeed, setSelectedSeed, viewMode }: MonteCarloDataTableProps) {
  const { data: simulation, isLoading } = useMonteCarloSimulationWithWorker();

  // Reset selectedSeed when simulation changes
  useEffect(() => setSelectedSeed(null), [setSelectedSeed, simulation, viewMode]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Table content is loading...</p>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Table content is unavailable</p>
      </div>
    );
  }

  return (
    <MonteCarloDataTableImpl simulation={simulation} selectedSeed={selectedSeed} setSelectedSeed={setSelectedSeed} viewMode={viewMode} />
  );
}
