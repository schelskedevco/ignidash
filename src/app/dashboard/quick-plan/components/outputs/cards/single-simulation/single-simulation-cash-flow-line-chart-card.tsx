'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationCashFlowLineChart from '../../charts/single-simulation/single-simulation-cash-flow-line-chart';

interface SingleSimulationCashFlowLineChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'cashFlow' | 'incomes' | 'expenses') => void;
  dataView: 'cashFlow' | 'incomes' | 'expenses';
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  startAge: number;
}

export default function SingleSimulationCashFlowLineChartCard({
  setSelectedAge,
  selectedAge,
  setDataView,
  dataView,
  rawChartData,
  startAge,
}: SingleSimulationCashFlowLineChartCardProps) {
  let title;
  switch (dataView) {
    case 'cashFlow':
      title = 'Cash Flow';
      break;
    case 'incomes':
      title = 'Incomes';
      break;
    case 'expenses':
      title = 'Expenses';
      break;
  }

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-48"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'cashFlow' | 'incomes' | 'expenses')}
        >
          <option value="cashFlow">Cash Flow</option>
          <option value="incomes">Incomes</option>
          <option value="expenses">Expenses</option>
        </Select>
      </div>
      <SingleSimulationCashFlowLineChart
        onAgeSelect={(age) => {
          if (age >= startAge + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
      />
    </Card>
  );
}
