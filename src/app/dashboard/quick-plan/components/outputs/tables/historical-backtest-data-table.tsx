'use client';

import { useMemo } from 'react';

import {
  useHistoricalBacktestTableData,
  useSimulationDetailData,
  useHistoricalBacktestYearlyResultsTableData,
} from '@/lib/stores/quick-plan-store';
import {
  type SimulationTableRow,
  type HistoricalBacktestTableRow,
  type YearlyAggregateTableRow,
} from '@/lib/schemas/simulation-table-schema';
import {
  generateHistoricalBacktestTableColumns,
  generateSimulationTableColumns,
  generateYearlyAggregateTableColumns,
} from '@/lib/utils/table-formatters';
import type { MultiSimulationResult } from '@/lib/calc/simulation-engine';

import Table from './table';

interface HistoricalBacktestDataTableProps {
  simulation: MultiSimulationResult;
  selectedSeed: number | null;
  setSelectedSeed: (seed: number | null) => void;
  viewMode: 'all' | 'yearly';
}

export default function HistoricalBacktestDataTable({
  simulation,
  selectedSeed,
  setSelectedSeed,
  viewMode,
}: HistoricalBacktestDataTableProps) {
  // Find the selected simulation result
  const selectedSimulation = useMemo(() => {
    if (selectedSeed === null) return null;

    const selectedSimulation = simulation.simulations.find(([seed]) => seed === selectedSeed);
    return selectedSimulation ? selectedSimulation[1] : null;
  }, [selectedSeed, simulation]);

  const allSimulationData = useHistoricalBacktestTableData(simulation);
  const yearlyData = useHistoricalBacktestYearlyResultsTableData(simulation);
  const detailData = useSimulationDetailData(selectedSimulation);

  const allSimulationColumns = useMemo(() => generateHistoricalBacktestTableColumns(), []);
  const yearlyColumns = useMemo(() => generateYearlyAggregateTableColumns(), []);
  const detailDataColumns = useMemo(() => generateSimulationTableColumns(), []);

  const handleRowClick = (row: HistoricalBacktestTableRow) => setSelectedSeed(row.seed);

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
  return (
    <Table<HistoricalBacktestTableRow>
      columns={allSimulationColumns}
      data={allSimulationData}
      keyField="seed"
      onRowClick={handleRowClick}
    />
  );
}
