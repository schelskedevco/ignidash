'use client';

import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { SingleSimulationTableRow } from '@/lib/schemas/single-simulation-table-schema';
import { SingleSimulationCategory } from '@/lib/types/single-simulation-category';
import { useSingleSimulationTableData } from '@/lib/stores/quick-plan-store';
import { generateSimulationTableColumns } from '@/lib/utils/single-simulation-table-formatters';

import Table from './table';

interface SingleSimulationDataTableProps {
  simulation: SimulationResult;
  currentCategory: SingleSimulationCategory;
}

export default function SingleSimulationDataTable({ simulation, currentCategory }: SingleSimulationDataTableProps) {
  const tableData = useSingleSimulationTableData(simulation, currentCategory);

  return <Table<SingleSimulationTableRow> columns={generateSimulationTableColumns()} data={tableData} keyField="year" />;
}
