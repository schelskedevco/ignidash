'use client';

import {
  useShowReferenceLinesPreference,
  useUpdatePreferences,
  useSingleSimulationPortfolioAssetTypeAreaChartData,
  type FixedReturnsKeyMetricsV2,
} from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { Switch } from '@/components/catalyst/switch';

import SingleSimulationPortfolioAssetTypeAreaChart from '../charts/single-simulation-portfolio-asset-type-area-chart';

interface SingleSimulationPortfolioAssetTypeAreaChartCardProps {
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

export default function SingleSimulationPortfolioAssetTypeAreaChartCard({
  simulation,
  keyMetrics,
  setSelectedAge,
  selectedAge,
}: SingleSimulationPortfolioAssetTypeAreaChartCardProps) {
  const startAge = simulation.context.startAge;
  const rawChartData = useSingleSimulationPortfolioAssetTypeAreaChartData(simulation);

  const showReferenceLines = useShowReferenceLinesPreference();
  const updatePreferences = useUpdatePreferences();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Portfolio by Asset Type</span>
        </h4>
        <Switch
          className="focus-outline"
          color="rose"
          checked={showReferenceLines}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updatePreferences('showReferenceLines', !showReferenceLines);
          }}
          onChange={() => updatePreferences('showReferenceLines', !showReferenceLines)}
          aria-label="Toggle reference lines"
        />
      </div>
      <SingleSimulationPortfolioAssetTypeAreaChart
        rawChartData={rawChartData}
        startAge={startAge}
        keyMetrics={keyMetrics}
        showReferenceLines={showReferenceLines}
        onAgeSelect={(age) => {
          if (age >= startAge + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
