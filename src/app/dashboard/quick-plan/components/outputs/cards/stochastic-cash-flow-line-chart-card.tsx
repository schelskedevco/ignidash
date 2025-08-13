'use client';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import StochasticCashFlowLineChart, { type StochasticCashFlowLineChartDataPoint } from '../charts/stochastic-cash-flow-line-chart';

interface StochasticCashFlowLineChartCardProps {
  setSelectedAge: (age: number) => void;
  age: number;
  rawChartData: StochasticCashFlowLineChartDataPoint[];
}

export default function StochasticCashFlowLineChartCard({ setSelectedAge, age, rawChartData }: StochasticCashFlowLineChartCardProps) {
  const currentAge = useCurrentAge();

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Net Cash Flow</span>
          <span className="text-muted-foreground">Time Series</span>
        </h4>
      </div>
      <StochasticCashFlowLineChart
        onAgeSelect={(newAge) => {
          if (newAge >= currentAge! + 1) setSelectedAge(newAge);
        }}
        age={age}
        rawChartData={rawChartData}
      />
    </Card>
  );
}
