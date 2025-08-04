/**
 * Table Formatters - Schema-driven column generation and formatting
 *
 * This module provides utilities to generate table columns from schema definitions
 * and format values according to their specified types.
 */

import { type SimulationTableRow, type ColumnFormat, SIMULATION_TABLE_CONFIG } from '@/lib/schemas/simulation-table-schema';
import { type TableColumn } from '@/lib/types/table';

// Currency formatter
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Format value based on column format type
export const formatValue = (value: SimulationTableRow[keyof SimulationTableRow], format: ColumnFormat): string => {
  if (typeof value !== 'number' && format !== 'string') {
    return '—'; // Return dash for invalid numeric values
  }

  switch (format) {
    case 'currency':
      return currencyFormatter.format(value as number);
    case 'percentage':
      return `${(value as number).toFixed(1)}%`;
    case 'number':
      return String(value);
    case 'string':
      return String(value);
    default:
      return String(value);
  }
};

// Generate table columns from schema configuration
export const generateSimulationTableColumns = (): TableColumn<SimulationTableRow>[] => {
  return Object.entries(SIMULATION_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof SimulationTableRow,
    title: config.title,
    format: (value: SimulationTableRow[keyof SimulationTableRow]) => formatValue(value, config.format),
  }));
};
