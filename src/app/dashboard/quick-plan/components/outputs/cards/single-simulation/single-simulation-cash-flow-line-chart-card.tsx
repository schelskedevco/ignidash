'use client';

import Card from '@/components/ui/card';
import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';

import SingleSimulationCashFlowLineChart from '../../charts/single-simulation/single-simulation-cash-flow-line-chart';

interface SingleSimulationCashFlowLineChartCardProps {
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  startAge: number;
}

export default function SingleSimulationCashFlowLineChartCard({
  setSelectedAge,
  selectedAge,
  rawChartData,
  startAge,
}: SingleSimulationCashFlowLineChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Cash Flow</span>
          <span className="text-muted-foreground">Time Series</span>
        </h4>
      </div>
      <SingleSimulationCashFlowLineChart
        onAgeSelect={(age) => {
          if (age >= startAge + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
      />
    </Card>
  );
}
