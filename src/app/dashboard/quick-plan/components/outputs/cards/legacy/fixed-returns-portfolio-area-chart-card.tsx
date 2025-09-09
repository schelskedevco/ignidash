'use client';

import { useCurrentAge, useShowReferenceLinesPreference, useUpdatePreferences } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import { Switch } from '@/components/catalyst/switch';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

import FixedReturnsPortfolioAreaChart from '../../charts/legacy/fixed-returns-portfolio-area-chart';

interface FixedReturnsPortfolioAreaChartCardProps {
  simulation: SimulationResult;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

export default function FixedReturnsPortfolioAreaChartCard({
  simulation,
  setSelectedAge,
  selectedAge,
}: FixedReturnsPortfolioAreaChartCardProps) {
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
      <FixedReturnsPortfolioAreaChart
        simulation={simulation}
        showReferenceLines={showReferenceLines}
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
