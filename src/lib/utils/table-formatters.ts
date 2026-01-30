import type { TableColumn } from '@/lib/types/table';
import type { ColumnFormat } from '@/lib/types/column-format';
import {
  type SingleSimulationNetWorthTableRow,
  SIMULATION_NET_WORTH_TABLE_CONFIG,
  type SingleSimulationCashFlowTableRow,
  SIMULATION_CASH_FLOW_TABLE_CONFIG,
  type SingleSimulationReturnsTableRow,
  SIMULATION_RETURNS_TABLE_CONFIG,
  type SingleSimulationTaxesTableRow,
  SIMULATION_TAXES_TABLE_CONFIG,
  type SingleSimulationContributionsTableRow,
  SIMULATION_CONTRIBUTIONS_TABLE_CONFIG,
  type SingleSimulationWithdrawalsTableRow,
  SIMULATION_WITHDRAWALS_TABLE_CONFIG,
} from '@/lib/schemas/tables/single-simulation-table-schema';
import {
  type MultiSimulationTableRow,
  MULTI_SIMULATION_TABLE_CONFIG,
  type YearlyAggregateTableRow,
  YEARLY_AGGREGATE_TABLE_CONFIG,
} from '@/lib/schemas/tables/multi-simulation-table-schema';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatValue = (value: unknown, format: ColumnFormat): string => {
  if (value == null) return '–';
  if (typeof value !== 'number' && format !== 'string' && format !== 'historicalRanges') return '–';

  switch (format) {
    case 'currency':
      return currencyFormatter.format(value as number);
    case 'percentage':
      return `${((value as number) * 100).toFixed(1)}%`;
    case 'number':
      return String(value);
    case 'string':
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      return String(value);
    case 'historicalRanges':
      return formatHistoricalRanges(value as Array<{ startYear: number; endYear: number }>);
    default:
      return String(value);
  }
};

const formatHistoricalRanges = (ranges: Array<{ startYear: number; endYear: number }>): string => {
  if (!ranges || ranges.length === 0) return '–';

  return ranges
    .map((range) => (range.startYear === range.endYear ? `${range.startYear}` : `${range.startYear}–${range.endYear}`))
    .join(', ');
};

export const generateNetWorthTableColumns = (): TableColumn<SingleSimulationNetWorthTableRow>[] => {
  return Object.entries(SIMULATION_NET_WORTH_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof SingleSimulationNetWorthTableRow,
    title: config.title,
    format: (value: SingleSimulationNetWorthTableRow[keyof SingleSimulationNetWorthTableRow]) => formatValue(value, config.format),
  }));
};

export const generateCashFlowTableColumns = (): TableColumn<SingleSimulationCashFlowTableRow>[] => {
  return Object.entries(SIMULATION_CASH_FLOW_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof SingleSimulationCashFlowTableRow,
    title: config.title,
    format: (value: SingleSimulationCashFlowTableRow[keyof SingleSimulationCashFlowTableRow]) => formatValue(value, config.format),
  }));
};

export const generateReturnsTableColumns = (): TableColumn<SingleSimulationReturnsTableRow>[] => {
  return Object.entries(SIMULATION_RETURNS_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof SingleSimulationReturnsTableRow,
    title: config.title,
    format: (value: SingleSimulationReturnsTableRow[keyof SingleSimulationReturnsTableRow]) => formatValue(value, config.format),
  }));
};

export const generateTaxesTableColumns = (): TableColumn<SingleSimulationTaxesTableRow>[] => {
  return Object.entries(SIMULATION_TAXES_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof SingleSimulationTaxesTableRow,
    title: config.title,
    format: (value: SingleSimulationTaxesTableRow[keyof SingleSimulationTaxesTableRow]) => formatValue(value, config.format),
  }));
};

export const generateContributionsTableColumns = (): TableColumn<SingleSimulationContributionsTableRow>[] => {
  return Object.entries(SIMULATION_CONTRIBUTIONS_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof SingleSimulationContributionsTableRow,
    title: config.title,
    format: (value: SingleSimulationContributionsTableRow[keyof SingleSimulationContributionsTableRow]) =>
      formatValue(value, config.format),
  }));
};

export const generateWithdrawalsTableColumns = (): TableColumn<SingleSimulationWithdrawalsTableRow>[] => {
  return Object.entries(SIMULATION_WITHDRAWALS_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof SingleSimulationWithdrawalsTableRow,
    title: config.title,
    format: (value: SingleSimulationWithdrawalsTableRow[keyof SingleSimulationWithdrawalsTableRow]) => formatValue(value, config.format),
  }));
};

export const generateMultiSimulationTableColumns = (): TableColumn<MultiSimulationTableRow>[] => {
  return Object.entries(MULTI_SIMULATION_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof MultiSimulationTableRow,
    title: config.title,
    format: (value: MultiSimulationTableRow[keyof MultiSimulationTableRow]) => formatValue(value, config.format),
  }));
};

export const generateYearlyAggregateTableColumns = (): TableColumn<YearlyAggregateTableRow>[] => {
  return Object.entries(YEARLY_AGGREGATE_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof YearlyAggregateTableRow,
    title: config.title,
    format: (value: YearlyAggregateTableRow[keyof YearlyAggregateTableRow]) => formatValue(value, config.format),
  }));
};
