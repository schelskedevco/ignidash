'use client';

import { useState, memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import { generateMultiSimulationTableColumns, generateYearlyAggregateTableColumns } from '@/lib/utils/table-formatters';

import TableTypeSelector, { TableType } from '../table-type-selector';
import Table from '../tables/table';
import SingleSimulationDataTable from '../tables/single-simulation-data-table';

interface TableWithSelectedSeedProps {
  currentCategory: SimulationCategory;
  onEscPressed: () => void;
  simulation: SimulationResult;
}

function TableWithSelectedSeed({ currentCategory, onEscPressed, simulation }: TableWithSelectedSeedProps) {
  return <SingleSimulationDataTable simulation={simulation} currentCategory={currentCategory} onEscPressed={onEscPressed} />;
}

interface MultiSimulationDataTableSectionProps {
  simulation: SimulationResult | null | undefined;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  currentCategory: SimulationCategory;
  activeSeed: number | undefined;
  setSelectedSeedFromTable: (seed: number | null) => void;
}

function MultiSimulationDataTableSection({
  simulation,
  tableData,
  yearlyTableData,
  currentCategory,
  activeSeed,
  setSelectedSeedFromTable,
}: MultiSimulationDataTableSectionProps) {
  const [currentTableType, setCurrentTableType] = useState<TableType>(TableType.AllSimulations);

  const withScrollPreservation = useScrollPreservation();
  const handleRowClick = withScrollPreservation((row: MultiSimulationTableRow) => setSelectedSeedFromTable(row.seed));

  let tableComponent;
  if (activeSeed && simulation) {
    tableComponent = (
      <TableWithSelectedSeed
        currentCategory={currentCategory}
        onEscPressed={withScrollPreservation(() => setSelectedSeedFromTable(null))}
        simulation={simulation}
      />
    );
  } else {
    switch (currentTableType) {
      case TableType.AllSimulations:
        tableComponent = (
          <Table<MultiSimulationTableRow>
            columns={generateMultiSimulationTableColumns()}
            data={tableData}
            keyField="seed"
            onRowClick={handleRowClick}
          />
        );
        break;
      case TableType.YearlyResults:
        tableComponent = (
          <Table<YearlyAggregateTableRow> columns={generateYearlyAggregateTableColumns()} data={yearlyTableData} keyField="year" />
        );
        break;
    }
  }

  return (
    <SectionContainer showBottomBorder className="mb-8">
      {!activeSeed && <TableTypeSelector currentType={currentTableType} setCurrentType={setCurrentTableType} />}
      {tableComponent}
    </SectionContainer>
  );
}

export default memo(MultiSimulationDataTableSection);
