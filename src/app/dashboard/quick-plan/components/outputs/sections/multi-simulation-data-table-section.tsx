'use client';

import { useState, memo } from 'react';

import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';
import type { SingleSimulationTableRow } from '@/lib/schemas/single-simulation-table-schema';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import {
  generateSimulationTableColumns,
  generateMultiSimulationTableColumns,
  generateYearlyAggregateTableColumns,
} from '@/lib/utils/table-formatters';
import { useSingleSimulationTableData } from '@/lib/stores/quick-plan-store';

import TableTypeSelector, { TableType } from '../table-type-selector';
import Table from '../tables/table';
import DrillDownBreadcrumb from '../drill-down-breadcrumb';

interface TableWithSelectedSeedProps {
  currentCategory: SimulationCategory;
  onEscPressed: () => void;
  simulation: SimulationResult;
}

function TableWithSelectedSeed({ currentCategory, onEscPressed, simulation }: TableWithSelectedSeedProps) {
  const tableData = useSingleSimulationTableData(simulation, currentCategory);

  return (
    <Table<SingleSimulationTableRow>
      columns={generateSimulationTableColumns()}
      data={tableData}
      keyField="year"
      onEscPressed={onEscPressed}
    />
  );
}

interface MultiSimulationDataTableSectionProps {
  simulation: SimulationResult;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  currentCategory: SimulationCategory;
  setSelectedSeed: (seed: number | null) => void;
  selectedSeed: number | null;
}

function MultiSimulationDataTableSection({
  simulation,
  tableData,
  yearlyTableData,
  currentCategory,
  setSelectedSeed,
  selectedSeed,
}: MultiSimulationDataTableSectionProps) {
  const [currentTableType, setCurrentTableType] = useState<TableType>(TableType.AllSimulations);

  const withScrollPreservation = useScrollPreservation();
  const handleRowClick = withScrollPreservation((row: MultiSimulationTableRow) => setSelectedSeed(row.seed));

  let headerText: string | React.ReactNode;
  let headerDesc: string;

  if (selectedSeed !== null) {
    headerText = <DrillDownBreadcrumb selectedSeed={selectedSeed} setSelectedSeed={setSelectedSeed} />;
    headerDesc = 'Year-by-year progression and outcome for this simulation.';
  } else if (currentTableType === TableType.YearlyResults) {
    headerText = 'Yearly Results';
    headerDesc = 'View aggregated statistics across all simulations by year.';
  } else {
    headerText = 'All Simulations';
    headerDesc = 'Browse all simulation runs. Select one to explore further.';
  }

  let tableComponent;
  if (selectedSeed !== null) {
    tableComponent = (
      <TableWithSelectedSeed
        currentCategory={currentCategory}
        onEscPressed={withScrollPreservation(() => setSelectedSeed(null))}
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
