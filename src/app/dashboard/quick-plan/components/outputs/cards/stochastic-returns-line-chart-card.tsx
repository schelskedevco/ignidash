'use client';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import type { StochasticReturnsChartDataPoint } from '@/lib/types/chart-data-points';

import StochasticReturnsLineChart from '../charts/stochastic-returns-line-chart';

interface StochasticReturnsLineChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  rawChartData: StochasticReturnsChartDataPoint[];
}

export default function StochasticReturnsLineChartCard({ setSelectedAge, selectedAge, rawChartData }: StochasticReturnsLineChartCardProps) {
  const currentAge = useCurrentAge();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Returns</span>
          <span className="text-muted-foreground">Time Series</span>
        </h4>
      </div>
      <StochasticReturnsLineChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
      />
    </Card>
  );
}
