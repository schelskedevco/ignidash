'use client';

import { useMemo, useEffect } from 'react';

import {
  useHistoricalBacktestTableDataWithWorker,
  useSingleHistoricalBacktestSimulation,
  useStochasticDrillDownTableData,
  useStochasticYearlyResultsTableData,
} from '@/lib/stores/quick-plan-store';
import type { SimulationTableRow, StochasticTableRow, YearlyAggregateTableRow } from '@/lib/schemas/simulation-table-schema';
import {
  generateStochasticTableColumns,
  generateSimulationTableColumns,
  generateYearlyAggregateTableColumns,
} from '@/lib/utils/table-formatters';
import type { AggregateSimulationStats } from '@/lib/calc/simulation-analyzer';

import Table from './table';

interface HistoricalBacktestDataTableImplProps {
  tableData: StochasticTableRow[];
  simStats: AggregateSimulationStats;
  selectedSeed: number | null;
  setSelectedSeed: (seed: number | null) => void;
  viewMode: 'all' | 'yearly';
}

function HistoricalBacktestDataTableImpl({
  tableData,
  simStats,
  selectedSeed,
  setSelectedSeed,
  viewMode,
}: HistoricalBacktestDataTableImplProps) {
  const selectedSimulation = useSingleHistoricalBacktestSimulation(selectedSeed);

  const yearlyData = useStochasticYearlyResultsTableData(simStats);
  const detailData = useStochasticDrillDownTableData(selectedSimulation);

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
  return <Table<StochasticTableRow> columns={allSimulationColumns} data={tableData} keyField="seed" onRowClick={handleRowClick} />;
}

interface HistoricalBacktestDataTableProps {
  simStats: AggregateSimulationStats;
  selectedSeed: number | null;
  setSelectedSeed: (seed: number | null) => void;
  viewMode: 'all' | 'yearly';
}

export default function HistoricalBacktestDataTable({
  simStats,
  selectedSeed,
  setSelectedSeed,
  viewMode,
}: HistoricalBacktestDataTableProps) {
  const { data: tableData, isLoading } = useHistoricalBacktestTableDataWithWorker();

  // Reset selectedSeed when simulation changes
  useEffect(() => setSelectedSeed(null), [setSelectedSeed, tableData, viewMode]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Table content is loading...</p>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Table content is unavailable</p>
      </div>
    );
  }

  return (
    <HistoricalBacktestDataTableImpl
      tableData={tableData}
      simStats={simStats}
      selectedSeed={selectedSeed}
      setSelectedSeed={setSelectedSeed}
      viewMode={viewMode}
    />
  );
}
