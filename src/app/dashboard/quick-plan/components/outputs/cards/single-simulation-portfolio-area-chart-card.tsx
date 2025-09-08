'use client';

import { useFirstTimelineCurrentAge } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import SingleSimulationPortfolioAreaChart from '../charts/single-simulation-portfolio-area-chart.tsx';

interface SingleSimulationPortfolioAreaChartCardProps {
  simulation: SimulationResult;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

export default function SingleSimulationPortfolioAreaChartCard({
  simulation,
  setSelectedAge,
  selectedAge,
}: SingleSimulationPortfolioAreaChartCardProps) {
  const currentAge = useFirstTimelineCurrentAge();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Portfolio Projection</span>
        </h4>
      </div>
      <SingleSimulationPortfolioAreaChart
        simulation={simulation}
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
