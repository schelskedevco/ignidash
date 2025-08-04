'use client';

import { useFixedReturnsTableData, type SimulationDataRow } from '@/lib/stores/quick-plan-store';

import Table from './table';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentageFormatter = (value: SimulationDataRow[keyof SimulationDataRow]) => {
  const numValue = value as number;
  return `${(numValue * 100).toFixed(1)}%`;
};

const inflationFormatter = (value: SimulationDataRow[keyof SimulationDataRow]) => {
  const numValue = value as number;
  return `${numValue.toFixed(1)}%`;
};

export default function SimulationDataTable() {
  const tableData = useFixedReturnsTableData();

  const columns = [
    {
      key: 'year' as keyof SimulationDataRow,
      title: 'Year',
    },
    {
      key: 'age' as keyof SimulationDataRow,
      title: 'Age',
    },
    {
      key: 'phaseName' as keyof SimulationDataRow,
      title: 'Phase Name',
    },
    {
      key: 'portfolioValue' as keyof SimulationDataRow,
      title: 'Portfolio Value',
      format: (value: SimulationDataRow[keyof SimulationDataRow]) => currencyFormatter.format(value as number),
    },
    {
      key: 'stocksValue' as keyof SimulationDataRow,
      title: 'Stocks Value',
      format: (value: SimulationDataRow[keyof SimulationDataRow]) => currencyFormatter.format(value as number),
    },
    {
      key: 'stocksReturn' as keyof SimulationDataRow,
      title: 'Stocks Return',
      format: percentageFormatter,
    },
    {
      key: 'bondsValue' as keyof SimulationDataRow,
      title: 'Bonds Value',
      format: (value: SimulationDataRow[keyof SimulationDataRow]) => currencyFormatter.format(value as number),
    },
    {
      key: 'bondsReturn' as keyof SimulationDataRow,
      title: 'Bonds Return',
      format: percentageFormatter,
    },
    {
      key: 'cashValue' as keyof SimulationDataRow,
      title: 'Cash Value',
      format: (value: SimulationDataRow[keyof SimulationDataRow]) => currencyFormatter.format(value as number),
    },
    {
      key: 'cashReturn' as keyof SimulationDataRow,
      title: 'Cash Return',
      format: percentageFormatter,
    },
    {
      key: 'inflationRate' as keyof SimulationDataRow,
      title: 'Inflation Rate',
      format: inflationFormatter,
    },
  ];

  return <Table<SimulationDataRow> columns={columns} data={tableData} keyField="year" />;
}
