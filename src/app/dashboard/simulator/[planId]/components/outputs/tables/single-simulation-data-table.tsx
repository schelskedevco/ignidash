'use client';

import type { SimulationResult } from '@/lib/calc/simulation-engine';
import type {
  SingleSimulationPortfolioTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/tables/single-simulation-table-schema';
import { SingleSimulationCategory } from '@/lib/types/simulation-category';
import {
  useSingleSimulationPortfolioTableData,
  useSingleSimulationCashFlowTableData,
  useSingleSimulationReturnsTableData,
  useSingleSimulationTaxesTableData,
  useSingleSimulationContributionsTableData,
  useSingleSimulationWithdrawalsTableData,
  useSingleSimulationCategory,
} from '@/lib/stores/simulator-store';
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
}

function PortfolioTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationPortfolioTableData(simulation);

  return <Table<SingleSimulationPortfolioTableRow> columns={generatePortfolioTableColumns()} data={tableData} keyField="year" />;
}

function CashFlowTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationCashFlowTableData(simulation);

  return <Table<SingleSimulationCashFlowTableRow> columns={generateCashFlowTableColumns()} data={tableData} keyField="year" />;
}

function ReturnsTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationReturnsTableData(simulation);

  return <Table<SingleSimulationReturnsTableRow> columns={generateReturnsTableColumns()} data={tableData} keyField="year" />;
}

function TaxesTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationTaxesTableData(simulation);

  return <Table<SingleSimulationTaxesTableRow> columns={generateTaxesTableColumns()} data={tableData} keyField="year" />;
}

function ContributionsTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationContributionsTableData(simulation);

  return <Table<SingleSimulationContributionsTableRow> columns={generateContributionsTableColumns()} data={tableData} keyField="year" />;
}

function WithdrawalsTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationWithdrawalsTableData(simulation);

  return <Table<SingleSimulationWithdrawalsTableRow> columns={generateWithdrawalsTableColumns()} data={tableData} keyField="year" />;
}

interface SingleSimulationDataTableProps {
  simulation: SimulationResult;
}

export default function SingleSimulationDataTable({ simulation }: SingleSimulationDataTableProps) {
  const resultsCategory = useSingleSimulationCategory();

  const props: TableCategoryProps = { simulation };

  switch (resultsCategory) {
    case SingleSimulationCategory.Portfolio:
      return <PortfolioTable {...props} />;
    case SingleSimulationCategory.CashFlow:
      return <CashFlowTable {...props} />;
    case SingleSimulationCategory.Returns:
      return <ReturnsTable {...props} />;
    case SingleSimulationCategory.Taxes:
      return <TaxesTable {...props} />;
    case SingleSimulationCategory.Contributions:
      return <ContributionsTable {...props} />;
    case SingleSimulationCategory.Withdrawals:
      return <WithdrawalsTable {...props} />;
  }
}
