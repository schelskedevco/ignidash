'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationCashFlowLineChart from '../../charts/single-simulation/single-simulation-cash-flow-line-chart';

interface SingleSimulationCashFlowLineChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'net' | 'incomes' | 'expenses' | 'custom') => void;
  dataView: 'net' | 'incomes' | 'expenses' | 'custom';
  setCustomDataID: (name: string) => void;
  customDataID: string;
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  startAge: number;
}

export default function SingleSimulationCashFlowLineChartCard({
  setSelectedAge,
  selectedAge,
  setDataView,
  dataView,
  setCustomDataID,
  customDataID,
  rawChartData,
  startAge,
}: SingleSimulationCashFlowLineChartCardProps) {
  const getUniqueItems = (items: Array<{ id: string; name: string }>) => {
    return Array.from(new Map(items.map((item) => [item.id, { id: item.id, name: item.name }])).values());
  };

  const uniqueIncomes = getUniqueItems(rawChartData.flatMap((dataPoint) => dataPoint.perIncomeData));
  const uniqueExpenses = getUniqueItems(rawChartData.flatMap((dataPoint) => dataPoint.perExpenseData));

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Cash Flow</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-48"
          id="data-view"
          name="data-view"
          value={dataView === 'custom' ? customDataID : dataView}
          onChange={(e) => {
            const isCustomSelection = e.target.value !== 'net' && e.target.value !== 'incomes' && e.target.value !== 'expenses';
            if (isCustomSelection) {
              setDataView('custom');
              setCustomDataID(e.target.value);
            } else {
              setDataView(e.target.value as 'net' | 'incomes' | 'expenses');
              setCustomDataID('');
            }
          }}
        >
          <optgroup label="Aggregate">
            <option value="net">Cash Flow</option>
            <option value="incomes">Income</option>
            <option value="expenses">Expenses</option>
          </optgroup>
          <optgroup label="Custom Incomes">
            {uniqueIncomes.map((income) => (
              <option key={income.id} value={income.id}>
                {income.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Custom Expenses">
            {uniqueExpenses.map((expense) => (
              <option key={expense.id} value={expense.id}>
                {expense.name}
              </option>
            ))}
          </optgroup>
        </Select>
      </div>
      <SingleSimulationCashFlowLineChart
        onAgeSelect={(age) => {
          if (age >= startAge + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        customDataID={customDataID}
      />
    </Card>
  );
}
