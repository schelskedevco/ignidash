'use client';

import { useShowReferenceLinesPreference, type FixedReturnsKeyMetricsV2 } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import type { SingleSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationPortfolioAreaChart from '../../charts/single-simulation/single-simulation-portfolio-area-chart';

interface SingleSimulationPortfolioAssetTypeAreaChartCardProps {
  rawChartData: SingleSimulationPortfolioChartDataPoint[];
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  setDataView: (view: 'asset' | 'account') => void;
  dataView: 'asset' | 'account';
  startAge: number;
}

export default function SingleSimulationPortfolioAssetTypeAreaChartCard({
  rawChartData,
  keyMetrics,
  setSelectedAge,
  selectedAge,
  setDataView,
  dataView,
  startAge,
}: SingleSimulationPortfolioAssetTypeAreaChartCardProps) {
  const showReferenceLines = useShowReferenceLinesPreference();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold whitespace-nowrap">
          <span className="mr-2">Portfolio</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </h4>
        <Select
          className="max-w-48"
          id="data-view"
          name="data-view"
          value={dataView}
          onChange={(e) => setDataView(e.target.value as 'asset' | 'account')}
        >
          <option value="asset">Asset Class</option>
          <option value="account">Account Category</option>
        </Select>
      </div>
      <SingleSimulationPortfolioAreaChart
        rawChartData={rawChartData}
        startAge={startAge}
        keyMetrics={keyMetrics}
        showReferenceLines={showReferenceLines}
        dataView={dataView}
        onAgeSelect={(age) => {
          if (age >= startAge + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
