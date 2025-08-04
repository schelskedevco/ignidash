/**
 * Table Formatters - Schema-driven column generation and formatting
 *
 * This module provides utilities to generate table columns from schema definitions
 * and format values according to their specified types.
 */

import {
  type SimulationTableRow,
  type ColumnFormat,
  SIMULATION_TABLE_CONFIG,
  type MonteCarloTableRow,
  MONTE_CARLO_TABLE_CONFIG,
} from '@/lib/schemas/simulation-table-schema';
import { type TableColumn } from '@/lib/types/table';

// Currency formatter
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Format value based on column format type (now supports all table types)
export const formatValue = (value: unknown, format: ColumnFormat): string => {
  if (value == null) return '—'; // Return dash for null/undefined values
  if (typeof value !== 'number' && format !== 'string') return '—'; // Return dash for invalid numeric values

  switch (format) {
    case 'currency':
      return currencyFormatter.format(value as number);
    case 'percentage':
      return `${(value as number).toFixed(1)}%`;
    case 'number':
      return String(value);
    case 'string':
      // Special handling for boolean values
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
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

// Generate Monte Carlo table columns from schema configuration
export const generateMonteCarloTableColumns = (): TableColumn<MonteCarloTableRow>[] => {
  return Object.entries(MONTE_CARLO_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof MonteCarloTableRow,
    title: config.title,
    format: (value: MonteCarloTableRow[keyof MonteCarloTableRow]) => formatValue(value, config.format),
  }));
};
