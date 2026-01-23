'use client';

import { useMemo, useCallback } from 'react';

import { useShowReferenceLines } from '@/lib/stores/simulator-store';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationIncomeExpensesChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationIncomeExpensesLineChart from '../../charts/single-simulation/single-simulation-income-expenses-line-chart';
import ChartTimeFrameDropdown from '../../chart-time-frame-dropdown';

interface SingleSimulationIncomeExpensesLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'surplusDeficit' | 'cashFlow' | 'incomes' | 'expenses' | 'custom' | 'savingsRate') => void;
  dataView: 'surplusDeficit' | 'cashFlow' | 'incomes' | 'expenses' | 'custom' | 'savingsRate';
  setCustomDataID: (name: string) => void;
  customDataID: string;
  rawChartData: SingleSimulationIncomeExpensesChartDataPoint[];
  keyMetrics: KeyMetrics;
  startAge: number;
}

export default function SingleSimulationIncomeExpensesLineChartCard({
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  setCustomDataID,
  customDataID,
  rawChartData,
  keyMetrics,
  startAge,
}: SingleSimulationIncomeExpensesLineChartCardProps) {
  const showReferenceLines = useShowReferenceLines();

  const getUniqueItems = useCallback((items: Array<{ id: string; name: string }>) => {
    return Array.from(new Map(items.map((item) => [item.id, { id: item.id, name: item.name }])).values());
  }, []);

  const uniqueIncomes = useMemo(
    () => getUniqueItems(rawChartData.flatMap((dataPoint) => dataPoint.perIncomeData)),
    [getUniqueItems, rawChartData]
  );
  const uniqueExpenses = useMemo(
    () => getUniqueItems(rawChartData.flatMap((dataPoint) => dataPoint.perExpenseData)),
    [getUniqueItems, rawChartData]
  );

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3} className="truncate">
          <span className="mr-2">Cash Flow</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            aria-label="Cash flow data view options"
            className="max-w-48 sm:max-w-64"
            id="cash-flow-data-view"
            name="cash-flow-data-view"
            value={dataView === 'custom' ? customDataID : dataView}
            onChange={(e) => {
              const isCustomSelection =
                e.target.value !== 'surplusDeficit' &&
                e.target.value !== 'cashFlow' &&
                e.target.value !== 'incomes' &&
                e.target.value !== 'expenses' &&
                e.target.value !== 'savingsRate';
              if (isCustomSelection) {
                setDataView('custom');
                setCustomDataID(e.target.value);
              } else {
                setDataView(e.target.value as 'surplusDeficit' | 'cashFlow' | 'incomes' | 'expenses' | 'savingsRate');
                setCustomDataID('');
              }
            }}
          >
            <option value="surplusDeficit">Surplus/Deficit</option>
            <option value="cashFlow">Cash Flow</option>
            <option value="incomes">Income Sources</option>
            <option value="expenses">Expenses &amp; Taxes</option>
            <option value="savingsRate">Savings Rate</option>
            <optgroup label="By Income">
              {uniqueIncomes.map((income) => (
                <option key={income.id} value={income.id}>
                  {income.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="By Expense">
              {uniqueExpenses.map((expense) => (
                <option key={expense.id} value={expense.id}>
                  {expense.name}
                </option>
              ))}
            </optgroup>
          </Select>
          <ChartTimeFrameDropdown timeFrameType="single" />
        </div>
      </div>
      <SingleSimulationIncomeExpensesLineChart
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        keyMetrics={keyMetrics}
        showReferenceLines={showReferenceLines}
        rawChartData={rawChartData}
        dataView={dataView}
        customDataID={customDataID}
        startAge={startAge}
      />
    </Card>
  );
}
