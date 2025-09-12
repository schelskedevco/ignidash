'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationReturnsLineChart from '../../charts/single-simulation/single-simulation-returns-line-chart';

interface SingleSimulationReturnsLineChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'rates' | 'annualAmounts' | 'totalAmounts') => void;
  dataView: 'rates' | 'annualAmounts' | 'totalAmounts';
  rawChartData: SingleSimulationReturnsChartDataPoint[];
  startAge: number;
}

export default function SingleSimulationReturnsLineChartCard({
  setSelectedAge,
  selectedAge,
  setDataView,
  dataView,
  rawChartData,
  startAge,
}: SingleSimulationReturnsLineChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Returns</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-48"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'rates' | 'annualAmounts' | 'totalAmounts')}
        >
          <option value="rates">Rates</option>
          <option value="annualAmounts">Annual Amounts</option>
          <option value="totalAmounts">Total Amounts</option>
        </Select>
      </div>
      <SingleSimulationReturnsLineChart
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
