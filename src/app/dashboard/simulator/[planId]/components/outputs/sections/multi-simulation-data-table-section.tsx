'use client';

import { useState, memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
import { generateMultiSimulationTableColumns, generateYearlyAggregateTableColumns } from '@/lib/utils/table-formatters';

import TableTypeSelector, { TableType } from '../table-type-selector';
import Table from '../tables/table';
import SingleSimulationDataTable from '../tables/single-simulation-data-table';

interface TableWithSelectedSeedProps {
  simulation: SimulationResult;
}

function TableWithSelectedSeed({ simulation }: TableWithSelectedSeedProps) {
  return <SingleSimulationDataTable simulation={simulation} />;
}

interface MultiSimulationDataTableSectionProps {
  simulation: SimulationResult | null | undefined;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  activeSeed: number | undefined;
  handleSeedFromTableChange: (seed: number | null) => void;
}

function MultiSimulationDataTableSection({
  simulation,
  tableData,
  yearlyTableData,
  activeSeed,
  handleSeedFromTableChange,
}: MultiSimulationDataTableSectionProps) {
  const [currentTableType, setCurrentTableType] = useState<TableType>(TableType.AllSimulations);

  let tableComponent;
  if (activeSeed && simulation) {
    tableComponent = <TableWithSelectedSeed simulation={simulation} />;
  } else {
    switch (currentTableType) {
      case TableType.AllSimulations:
        tableComponent = (
          <Table<MultiSimulationTableRow>
            columns={generateMultiSimulationTableColumns()}
            data={tableData}
            keyField="seed"
            onRowClick={(row: MultiSimulationTableRow) => handleSeedFromTableChange(row.seed)}
            exportFilename="multi-simulation-data.csv"
          />
        );
        break;
      case TableType.YearlyResults:
        tableComponent = (
          <Table<YearlyAggregateTableRow>
            columns={generateYearlyAggregateTableColumns()}
            data={yearlyTableData}
            keyField="year"
            exportFilename="yearly-aggregate-data.csv"
          />
        );
        break;
    }
  }

  return (
    <SectionContainer showBottomBorder={false} className="mb-0">
      {!activeSeed && <TableTypeSelector currentType={currentTableType} setCurrentType={setCurrentTableType} />}
      {tableComponent}
    </SectionContainer>
  );
}

export default memo(MultiSimulationDataTableSection);
