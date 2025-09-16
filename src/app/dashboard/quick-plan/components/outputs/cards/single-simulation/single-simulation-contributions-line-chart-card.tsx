'use client';

import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationContributionsChartDataPoint } from '@/lib/types/chart-data-points';
import { useShowReferenceLinesPreference, type FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';

import SingleSimulationContributionsLineChart from '../../charts/single-simulation/single-simulation-contributions-line-chart';

interface SingleSimulationContributionsLineChartCardProps {
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'annualAmounts' | 'totalAmounts' | 'taxTreatment') => void;
  dataView: 'annualAmounts' | 'totalAmounts' | 'taxTreatment';
  rawChartData: SingleSimulationContributionsChartDataPoint[];
  keyMetrics: FixedReturnsKeyMetricsV2;
  startAge: number;
}

export default function SingleSimulationContributionsLineChartCard({
  onAgeSelect,
  selectedAge,
  setDataView,
  dataView,
  rawChartData,
  keyMetrics,
  startAge,
}: SingleSimulationContributionsLineChartCardProps) {
  const showReferenceLines = useShowReferenceLinesPreference();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Contributions</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-64"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'annualAmounts' | 'totalAmounts' | 'taxTreatment')}
        >
          <option value="taxTreatment">Tax Treatment</option>
          <option value="annualAmounts">Annual Amounts</option>
          <option value="totalAmounts">Total Amounts</option>
        </Select>
      </div>
      <SingleSimulationContributionsLineChart
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
