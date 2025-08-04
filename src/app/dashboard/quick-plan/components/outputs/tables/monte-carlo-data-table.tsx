'use client';

import { useMonteCarloTableData } from '@/lib/stores/quick-plan-store';
import { type MonteCarloTableRow } from '@/lib/schemas/simulation-table-schema';
import { generateMonteCarloTableColumns } from '@/lib/utils/table-formatters';

import Table from './table';

export default function MonteCarloDataTable() {
  const tableData = useMonteCarloTableData();

  return <Table<MonteCarloTableRow> columns={generateMonteCarloTableColumns()} data={tableData} keyField="seed" />;
}
