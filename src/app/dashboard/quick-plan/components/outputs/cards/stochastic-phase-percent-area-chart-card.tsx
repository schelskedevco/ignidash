'use client';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import StochasticPhasePercentAreaChart, {
  type StochasticPhasePercentAreaChartDataPoint,
} from '../charts/stochastic-phase-percent-area-chart';

interface StochasticPhasePercentAreaChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  rawChartData: StochasticPhasePercentAreaChartDataPoint[];
}

export default function StochasticPhasePercentAreaChartCard({
  setSelectedAge,
  selectedAge,
  rawChartData,
}: StochasticPhasePercentAreaChartCardProps) {
  const currentAge = useCurrentAge();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Phase Percent</span>
          <span className="text-muted-foreground">Time Series</span>
        </h4>
      </div>
      <StochasticPhasePercentAreaChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        chartData={rawChartData}
      />
    </Card>
  );
}
