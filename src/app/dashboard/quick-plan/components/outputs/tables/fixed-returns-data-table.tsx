'use client';

import { useFixedReturnsTableData } from '@/lib/stores/quick-plan-store';
import type { SimulationTableRow } from '@/lib/schemas/simulation-table-schema';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import { generateSimulationTableColumns } from '@/lib/utils/table-formatters';

import Table from './table';

interface FixedReturnsDataTableProps {
  simulation: SimulationResult;
}

export default function FixedReturnsDataTable({ simulation }: FixedReturnsDataTableProps) {
  const tableData = useFixedReturnsTableData(simulation);

  return <Table<SimulationTableRow> columns={generateSimulationTableColumns()} data={tableData} keyField="year" className="my-4" />;
}
