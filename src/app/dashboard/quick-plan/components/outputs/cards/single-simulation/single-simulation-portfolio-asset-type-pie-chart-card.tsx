'use client';

import Card from '@/components/ui/card';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import SingleSimulationPortfolioPieChart from '../../charts/single-simulation/single-simulation-portfolio-pie-chart';

interface SingleSimulationPortfolioAssetTypePieChartCardProps {
  simulation: SimulationResult;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

export default function SingleSimulationPortfolioAssetTypePieChartCard({
  simulation,
  setSelectedAge,
  selectedAge,
}: SingleSimulationPortfolioAssetTypePieChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-foreground flex items-center text-lg font-semibold">
          <span className="mr-2">Asset Type Allocation</span>
        </h4>
      </div>
      <SingleSimulationPortfolioPieChart />
    </Card>
  );
}
