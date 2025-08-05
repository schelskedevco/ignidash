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
  type HistoricalBacktestTableRow,
  HISTORICAL_BACKTEST_TABLE_CONFIG,
} from '@/lib/schemas/simulation-table-schema';
import { type TableColumn } from '@/lib/types/table';
import { type HistoricalPeriod } from '@/lib/calc/simulation-engine';

// Currency formatter
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format historical periods as readable ranges (e.g., "1978 — 2024, 1985 — 2024")
 * Takes an array of HistoricalPeriod objects and converts them to human-readable ranges
 */
export const formatHistoricalPeriods = (periods: HistoricalPeriod[]): string => {
  if (!periods || periods.length === 0) return '—';

  // Extract unique historical years and sort them
  const historicalYears = [...new Set(periods.map((p) => p.historicalYear))].sort((a, b) => a - b);

  if (historicalYears.length === 0) return '—';

  // Find contiguous ranges
  const ranges: string[] = [];
  let rangeStart = historicalYears[0];
  let rangeEnd = historicalYears[0];

  for (let i = 1; i < historicalYears.length; i++) {
    const currentYear = historicalYears[i];

    if (currentYear === rangeEnd + 1) {
      // Contiguous year, extend the current range
      rangeEnd = currentYear;
    } else {
      // Gap found, close current range and start a new one
      if (rangeStart === rangeEnd) {
        ranges.push(`${rangeStart}`);
      } else {
        ranges.push(`${rangeStart} — ${rangeEnd}`);
      }
      rangeStart = currentYear;
      rangeEnd = currentYear;
    }
  }

  // Close the final range
  if (rangeStart === rangeEnd) {
    ranges.push(`${rangeStart}`);
  } else {
    ranges.push(`${rangeStart} — ${rangeEnd}`);
  }

  return ranges.join(', ');
};

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

// Generate Historical Backtest table columns from schema configuration
export const generateHistoricalBacktestTableColumns = (): TableColumn<HistoricalBacktestTableRow>[] => {
  return Object.entries(HISTORICAL_BACKTEST_TABLE_CONFIG).map(([key, config]) => ({
    key: key as keyof HistoricalBacktestTableRow,
    title: config.title,
    format: (value: HistoricalBacktestTableRow[keyof HistoricalBacktestTableRow]) => formatValue(value, config.format),
  }));
};
