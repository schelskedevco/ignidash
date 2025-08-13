'use client';

import {
  useShowReferenceLinesPreference,
  useUpdatePreferences,
  useCurrentAge,
  type StochasticAnalysis,
} from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import { Switch } from '@/components/catalyst/switch';

import StochasticResultsChart, { type StochasticChartDataPoint } from '../charts/stochastic-results-area-chart';

interface StochasticPortfolioAreaChartCardProps {
  fireAnalysis: StochasticAnalysis | null;
  chartData: StochasticChartDataPoint[];
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

export default function StochasticPortfolioAreaChartCard({
  fireAnalysis,
  chartData,
  setSelectedAge,
  selectedAge,
}: StochasticPortfolioAreaChartCardProps) {
  const currentAge = useCurrentAge();
  const showReferenceLines = useShowReferenceLinesPreference();
  const updatePreferences = useUpdatePreferences();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Portfolio Projection</span>
          <span className="text-muted-foreground">Time Series</span>
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
      <StochasticResultsChart
        fireAnalysis={fireAnalysis}
        chartData={chartData}
        showReferenceLines={showReferenceLines}
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
