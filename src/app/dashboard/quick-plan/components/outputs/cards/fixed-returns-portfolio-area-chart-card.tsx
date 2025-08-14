'use client';

import { useCurrentAge, useShowReferenceLinesPreference, useUpdatePreferences } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import { Switch } from '@/components/catalyst/switch';

import FixedReturnsPortfolioAreaChart from '../charts/fixed-returns-portfolio-area-chart';

interface FixedReturnsPortfolioAreaChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

export default function FixedReturnsPortfolioAreaChartCard({ setSelectedAge, selectedAge }: FixedReturnsPortfolioAreaChartCardProps) {
  const currentAge = useCurrentAge();

  const showReferenceLines = useShowReferenceLinesPreference();
  const updatePreferences = useUpdatePreferences();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
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
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        showReferenceLines={showReferenceLines}
      />
    </Card>
  );
}
