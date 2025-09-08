'use client';

import {
  useShowReferenceLinesPreference,
  useUpdatePreferences,
  useSingleSimulationPortfolioAccountTypeAreaChartData,
  type FixedReturnsKeyMetricsV2,
} from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { Switch } from '@/components/catalyst/switch';

import SingleSimulationPortfolioAccountTypeAreaChart from '../../charts/single-simulation/single-simulation-portfolio-account-type-area-chart';

interface SingleSimulationPortfolioAccountTypeAreaChartCardProps {
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

export default function SingleSimulationPortfolioAccountTypeAreaChartCard({
  simulation,
  keyMetrics,
  setSelectedAge,
  selectedAge,
}: SingleSimulationPortfolioAccountTypeAreaChartCardProps) {
  const startAge = simulation.context.startAge;
  const rawChartData = useSingleSimulationPortfolioAccountTypeAreaChartData(simulation);

  const showReferenceLines = useShowReferenceLinesPreference();
  const updatePreferences = useUpdatePreferences();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Portfolio by Account Type</span>
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
      <SingleSimulationPortfolioAccountTypeAreaChart
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
