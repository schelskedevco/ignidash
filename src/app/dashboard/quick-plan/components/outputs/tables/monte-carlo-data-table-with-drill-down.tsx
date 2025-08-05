'use client';

import { useState, useMemo } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/16/solid';

import { useMonteCarloTableData, useSimulationDetailData } from '@/lib/stores/quick-plan-store';
import { type MonteCarloTableRow } from '@/lib/schemas/simulation-table-schema';
import { generateMonteCarloTableColumns, generateSimulationTableColumns } from '@/lib/utils/table-formatters';
import type { MultiSimulationResult } from '@/lib/calc/simulation-engine';

import Table from './table';

interface MonteCarloDataTableWithDrillDownProps {
  simulation: MultiSimulationResult;
}

export default function MonteCarloDataTableWithDrillDown({ simulation }: MonteCarloDataTableWithDrillDownProps) {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);

  // Find the selected simulation result
  const selectedSimulation = useMemo(() => {
    if (selectedSeed === null) return null;

    const selectedSimulation = simulation.simulations.find(([seed]) => seed === selectedSeed);
    return selectedSimulation ? selectedSimulation[1] : null;
  }, [selectedSeed, simulation]);

  const tableData = useMonteCarloTableData(simulation);
  const tableDataColumns = useMemo(() => generateMonteCarloTableColumns(), []);

  const detailData = useSimulationDetailData(selectedSimulation);
  const detailDataColumns = useMemo(() => generateSimulationTableColumns(), []);

  const handleRowClick = (row: MonteCarloTableRow) => setSelectedSeed(row.seed);
  const handleBack = () => setSelectedSeed(null);

  if (selectedSeed !== null) {
    return (
      <div>
        <div className="mb-4 px-4 sm:px-6 lg:px-8">
          <button onClick={handleBack} className="text-primary hover:text-primary/75 inline-flex items-center gap-2 text-sm font-medium">
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Summary
          </button>
          <h3 className="text-foreground mt-2 text-base font-semibold">Simulation #{selectedSeed} Details</h3>
        </div>
        <Table columns={detailDataColumns} data={detailData} keyField="year" />
      </div>
    );
  }

  return <Table<MonteCarloTableRow> columns={tableDataColumns} data={tableData} keyField="seed" onRowClick={handleRowClick} />;
}
