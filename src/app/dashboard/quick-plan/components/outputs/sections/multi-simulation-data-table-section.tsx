'use client';

import { useState, memo } from 'react';

import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import { generateMultiSimulationTableColumns, generateYearlyAggregateTableColumns } from '@/lib/utils/table-formatters';

import TableTypeSelector, { TableType } from '../table-type-selector';
import Table from '../tables/table';
import SingleSimulationDataTable from '../tables/single-simulation-data-table';
import DrillDownBreadcrumb from '../drill-down-breadcrumb';

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
  removeActiveSeed: () => void;
  activeSeed: number | undefined;
  setSelectedSeedFromTable: (seed: number | null) => void;
}

function MultiSimulationDataTableSection({
  simulation,
  tableData,
  yearlyTableData,
  currentCategory,
  removeActiveSeed,
  activeSeed,
  setSelectedSeedFromTable,
}: MultiSimulationDataTableSectionProps) {
  const [currentTableType, setCurrentTableType] = useState<TableType>(TableType.AllSimulations);

  const withScrollPreservation = useScrollPreservation();
  const handleRowClick = withScrollPreservation((row: MultiSimulationTableRow) => setSelectedSeedFromTable(row.seed));

  let headerText: string | React.ReactNode;
  let headerDesc: string;

  if (activeSeed !== null && simulation) {
    headerText = <DrillDownBreadcrumb activeSeed={activeSeed} removeActiveSeed={removeActiveSeed} rootLabel="Data Table" />;
    headerDesc = 'Year-by-year progression and outcome for this simulation.';
  } else if (currentTableType === TableType.YearlyResults) {
    headerText = 'Data Table';
    headerDesc = 'View aggregated statistics across all simulations by year.';
  } else {
    headerText = 'Data Table';
    headerDesc = 'Browse all simulation runs. Select one to explore further.';
  }

  let tableComponent;
  if (activeSeed !== null && simulation) {
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
    <SectionContainer showBottomBorder>
      <SectionHeader title={headerText} desc={headerDesc} className="mb-4" />
      <TableTypeSelector currentType={currentTableType} setCurrentType={setCurrentTableType} />
      {tableComponent}
    </SectionContainer>
  );
}

export default memo(MultiSimulationDataTableSection);
