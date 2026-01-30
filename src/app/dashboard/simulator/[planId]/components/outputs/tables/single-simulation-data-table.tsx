'use client';

import type { SimulationResult } from '@/lib/calc/simulation-engine';
import type {
  SingleSimulationNetWorthTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/tables/single-simulation-table-schema';
import { SingleSimulationCategory } from '@/lib/types/simulation-category';
import {
  useSingleSimulationNetWorthTableData,
  useSingleSimulationCashFlowTableData,
  useSingleSimulationReturnsTableData,
  useSingleSimulationTaxesTableData,
  useSingleSimulationContributionsTableData,
  useSingleSimulationWithdrawalsTableData,
  useSingleSimulationCategory,
} from '@/lib/stores/simulator-store';
import {
  generateNetWorthTableColumns,
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

function NetWorthTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationNetWorthTableData(simulation);

  return (
    <Table<SingleSimulationNetWorthTableRow>
      columns={generateNetWorthTableColumns()}
      data={tableData}
      keyField="year"
      exportFilename="net-worth-data.csv"
    />
  );
}

function CashFlowTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationCashFlowTableData(simulation);

  return (
    <Table<SingleSimulationCashFlowTableRow>
      columns={generateCashFlowTableColumns()}
      data={tableData}
      keyField="year"
      exportFilename="cash-flow-data.csv"
    />
  );
}

function ReturnsTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationReturnsTableData(simulation);

  return (
    <Table<SingleSimulationReturnsTableRow>
      columns={generateReturnsTableColumns()}
      data={tableData}
      keyField="year"
      exportFilename="returns-data.csv"
    />
  );
}

function TaxesTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationTaxesTableData(simulation);

  return (
    <Table<SingleSimulationTaxesTableRow>
      columns={generateTaxesTableColumns()}
      data={tableData}
      keyField="year"
      exportFilename="taxes-data.csv"
    />
  );
}

function ContributionsTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationContributionsTableData(simulation);

  return (
    <Table<SingleSimulationContributionsTableRow>
      columns={generateContributionsTableColumns()}
      data={tableData}
      keyField="year"
      exportFilename="contributions-data.csv"
    />
  );
}

function WithdrawalsTable({ simulation }: TableCategoryProps) {
  const tableData = useSingleSimulationWithdrawalsTableData(simulation);

  return (
    <Table<SingleSimulationWithdrawalsTableRow>
      columns={generateWithdrawalsTableColumns()}
      data={tableData}
      keyField="year"
      exportFilename="withdrawals-data.csv"
    />
  );
}

interface SingleSimulationDataTableProps {
  simulation: SimulationResult;
}

export default function SingleSimulationDataTable({ simulation }: SingleSimulationDataTableProps) {
  const resultsCategory = useSingleSimulationCategory();

  const props: TableCategoryProps = { simulation };

  switch (resultsCategory) {
    case SingleSimulationCategory.NetWorth:
      return <NetWorthTable {...props} />;
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
