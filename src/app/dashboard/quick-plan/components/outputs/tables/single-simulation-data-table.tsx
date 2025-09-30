'use client';

import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type {
  SingleSimulationPortfolioTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/single-simulation-table-schema';
import { SimulationCategory } from '@/lib/types/simulation-category';
import {
  useSingleSimulationPortfolioTableData,
  useSingleSimulationCashFlowTableData,
  useSingleSimulationReturnsTableData,
  useSingleSimulationTaxesTableData,
  useSingleSimulationContributionsTableData,
  useSingleSimulationWithdrawalsTableData,
} from '@/lib/stores/quick-plan-store';
import {
  generatePortfolioTableColumns,
  generateCashFlowTableColumns,
  generateReturnsTableColumns,
  generateTaxesTableColumns,
  generateContributionsTableColumns,
  generateWithdrawalsTableColumns,
} from '@/lib/utils/table-formatters';

import Table from './table';

interface TableCategoryProps {
  simulation: SimulationResult;
  onEscPressed?: () => void;
}

function PortfolioTable({ simulation, onEscPressed }: TableCategoryProps) {
  const tableData = useSingleSimulationPortfolioTableData(simulation);

  return (
    <Table<SingleSimulationPortfolioTableRow>
      columns={generatePortfolioTableColumns()}
      data={tableData}
      keyField="year"
      onEscPressed={onEscPressed}
    />
  );
}

function CashFlowTable({ simulation, onEscPressed }: TableCategoryProps) {
  const tableData = useSingleSimulationCashFlowTableData(simulation);

  return (
    <Table<SingleSimulationCashFlowTableRow>
      columns={generateCashFlowTableColumns()}
      data={tableData}
      keyField="year"
      onEscPressed={onEscPressed}
    />
  );
}

function ReturnsTable({ simulation, onEscPressed }: TableCategoryProps) {
  const tableData = useSingleSimulationReturnsTableData(simulation);

  return (
    <Table<SingleSimulationReturnsTableRow>
      columns={generateReturnsTableColumns()}
      data={tableData}
      keyField="year"
      onEscPressed={onEscPressed}
    />
  );
}

function TaxesTable({ simulation, onEscPressed }: TableCategoryProps) {
  const tableData = useSingleSimulationTaxesTableData(simulation);

  return (
    <Table<SingleSimulationTaxesTableRow>
      columns={generateTaxesTableColumns()}
      data={tableData}
      keyField="year"
      onEscPressed={onEscPressed}
    />
  );
}

function ContributionsTable({ simulation, onEscPressed }: TableCategoryProps) {
  const tableData = useSingleSimulationContributionsTableData(simulation);

  return (
    <Table<SingleSimulationContributionsTableRow>
      columns={generateContributionsTableColumns()}
      data={tableData}
      keyField="year"
      onEscPressed={onEscPressed}
    />
  );
}

function WithdrawalsTable({ simulation, onEscPressed }: TableCategoryProps) {
  const tableData = useSingleSimulationWithdrawalsTableData(simulation);

  return (
    <Table<SingleSimulationWithdrawalsTableRow>
      columns={generateWithdrawalsTableColumns()}
      data={tableData}
      keyField="year"
      onEscPressed={onEscPressed}
    />
  );
}

interface SingleSimulationDataTableProps {
  simulation: SimulationResult;
  currentCategory: SimulationCategory;
  onEscPressed?: () => void;
}

export default function SingleSimulationDataTable({ simulation, currentCategory, onEscPressed }: SingleSimulationDataTableProps) {
  const props: TableCategoryProps = { simulation, onEscPressed };

  switch (currentCategory) {
    case SimulationCategory.Portfolio:
      return <PortfolioTable {...props} />;
    case SimulationCategory.CashFlow:
      return <CashFlowTable {...props} />;
    case SimulationCategory.Returns:
      return <ReturnsTable {...props} />;
    case SimulationCategory.Taxes:
      return <TaxesTable {...props} />;
    case SimulationCategory.Contributions:
      return <ContributionsTable {...props} />;
    case SimulationCategory.Withdrawals:
      return <WithdrawalsTable {...props} />;
  }
}
