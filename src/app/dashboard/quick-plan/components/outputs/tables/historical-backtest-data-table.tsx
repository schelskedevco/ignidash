'use client';

import { useHistoricalBacktestTableData } from '@/lib/stores/quick-plan-store';
import { type HistoricalBacktestTableRow } from '@/lib/schemas/simulation-table-schema';
import { generateHistoricalBacktestTableColumns } from '@/lib/utils/table-formatters';

import Table from './table';

export default function HistoricalBacktestDataTable() {
  const tableData = useHistoricalBacktestTableData();

  return <Table<HistoricalBacktestTableRow> columns={generateHistoricalBacktestTableColumns()} data={tableData} keyField="seed" />;
}
