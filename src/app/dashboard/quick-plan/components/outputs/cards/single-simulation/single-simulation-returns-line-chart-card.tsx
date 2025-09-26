'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationReturnsChartDataPoint } from '@/lib/types/chart-data-points';
import { useShowReferenceLines } from '@/lib/stores/quick-plan-store';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import { Subheading } from '@/components/catalyst/heading';

import SingleSimulationReturnsLineChart from '../../charts/single-simulation/single-simulation-returns-line-chart';

interface SingleSimulationReturnsLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'rates' | 'annualAmounts' | 'totalAmounts') => void;
  dataView: 'rates' | 'annualAmounts' | 'totalAmounts';
  rawChartData: SingleSimulationReturnsChartDataPoint[];
  keyMetrics: KeyMetrics;
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
        <Subheading level={4}>
          <span className="mr-2">Returns</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
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
          <optgroup label="Return Amounts">
            <option value="annualAmounts">Annual Returns</option>
            <option value="totalAmounts">Total Returns</option>
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
