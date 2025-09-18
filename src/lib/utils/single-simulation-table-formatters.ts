import type { TableColumn } from '@/lib/types/table';
import { type SingleSimulationTableRow, type ColumnFormat, SIMULATION_TABLE_CONFIG } from '@/lib/schemas/single-simulation-table-schema';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatValue = (value: unknown, format: ColumnFormat): string => {
  if (value == null) return '—';
  if (typeof value !== 'number' && format !== 'string' && format !== 'historicalRanges') return '—';

  switch (format) {
    case 'currency':
      return currencyFormatter.format(value as number);
    case 'percentage':
      return `${(value as number).toFixed(1)}%`;
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
  if (!ranges || ranges.length === 0) return '—';

  return ranges
    .map((range) => (range.startYear === range.endYear ? `${range.startYear}` : `${range.startYear}—${range.endYear}`))
    .join(', ');
};

export const generateSimulationTableColumns = (): TableColumn<SingleSimulationTableRow>[] => {
  return Object.entries(SIMULATION_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof SingleSimulationTableRow,
    title: config.title,
    format: (value: SingleSimulationTableRow[keyof SingleSimulationTableRow]) => formatValue(value, config.format),
  }));
};
