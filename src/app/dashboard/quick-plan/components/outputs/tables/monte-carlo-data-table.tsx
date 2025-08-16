'use client';

import { useMemo, useEffect } from 'react';

import {
  useMonteCarloTableDataWithWorker,
  useSingleMonteCarloSimulation,
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
import { TableType } from '../table-type-selector';

interface MonteCarloDataTableImplProps {
  tableData: StochasticTableRow[];
  simStats: AggregateSimulationStats;
  selectedSeed: number | null;
  setSelectedSeed: (seed: number | null) => void;
  currentTableType: TableType;
}

function MonteCarloDataTableImpl({ tableData, simStats, selectedSeed, setSelectedSeed, currentTableType }: MonteCarloDataTableImplProps) {
  const selectedSimulation = useSingleMonteCarloSimulation(selectedSeed);

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
  if (currentTableType === TableType.YearlyResults) {
    return <Table<YearlyAggregateTableRow> columns={yearlyColumns} data={yearlyData} keyField="year" />;
  }

  // Default: viewing all simulations
  return <Table<StochasticTableRow> columns={allSimulationColumns} data={tableData} keyField="seed" onRowClick={handleRowClick} />;
}

interface MonteCarloDataTableProps {
  simStats: AggregateSimulationStats;
  selectedSeed: number | null;
  setSelectedSeed: (seed: number | null) => void;
  currentTableType: TableType;
}

export default function MonteCarloDataTable({ simStats, selectedSeed, setSelectedSeed, currentTableType }: MonteCarloDataTableProps) {
  const { data: tableData, isLoading } = useMonteCarloTableDataWithWorker();

  // Reset selectedSeed when simulation changes
  useEffect(() => setSelectedSeed(null), [setSelectedSeed, tableData, currentTableType]);

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
    <MonteCarloDataTableImpl
      tableData={tableData}
      simStats={simStats}
      selectedSeed={selectedSeed}
      setSelectedSeed={setSelectedSeed}
      currentTableType={currentTableType}
    />
  );
}
