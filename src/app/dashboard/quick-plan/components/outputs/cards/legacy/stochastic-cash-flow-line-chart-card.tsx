'use client';

import { useCurrentAge } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import type { StochasticCashFlowChartDataPoint } from '@/lib/types/chart-data-points';

import StochasticCashFlowLineChart from '../../charts/legacy/stochastic-cash-flow-line-chart';

interface StochasticCashFlowLineChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  rawChartData: StochasticCashFlowChartDataPoint[];
}

export default function StochasticCashFlowLineChartCard({
  setSelectedAge,
  selectedAge,
  rawChartData,
}: StochasticCashFlowLineChartCardProps) {
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
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
      />
    </Card>
  );
}
