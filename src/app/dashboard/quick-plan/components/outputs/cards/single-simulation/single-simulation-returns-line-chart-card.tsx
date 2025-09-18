'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';
import { useShowReferenceLines, type FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';

import SingleSimulationReturnsLineChart from '../../charts/single-simulation/single-simulation-returns-line-chart';

interface SingleSimulationReturnsLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'rates' | 'annualAmounts' | 'totalAmounts') => void;
  dataView: 'rates' | 'annualAmounts' | 'totalAmounts';
  rawChartData: SingleSimulationReturnsChartDataPoint[];
  keyMetrics: FixedReturnsKeyMetricsV2;
  startAge: number;
}

export default function SingleSimulationReturnsLineChartCard({
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  rawChartData,
  keyMetrics,
  startAge,
}: SingleSimulationReturnsLineChartCardProps) {
  const showReferenceLines = useShowReferenceLines();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Returns</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-48 sm:max-w-64"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'rates' | 'annualAmounts' | 'totalAmounts')}
        >
          <optgroup label="Return Rates">
            <option value="rates">Annual Rates</option>
          </optgroup>
          <optgroup label="Dollar Amounts">
            <option value="annualAmounts">Annual Amounts</option>
            <option value="totalAmounts">Total Amounts</option>
          </optgroup>
        </Select>
      </div>
      <SingleSimulationReturnsLineChart
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        showReferenceLines={showReferenceLines}
        dataView={dataView}
        startAge={startAge}
      />
    </Card>
  );
}
