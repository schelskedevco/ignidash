import Card from '@/components/ui/card';
import type { MultiSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import MultiSimulationPortfolioAreaChart from '../../charts/multi-simulation/multi-simulation-portfolio-area-chart';

interface MultiSimulationPortfolioAreaChartCardProps {
  rawChartData: MultiSimulationPortfolioChartDataPoint[];
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  startAge: number;
}

export default function MultiSimulationPortfolioAreaChartCard({
  rawChartData,
  onAgeSelect,
  selectedAge,
  startAge,
}: MultiSimulationPortfolioAreaChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={4}>
          <span className="mr-2">Portfolio</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
      </div>
      <MultiSimulationPortfolioAreaChart
        rawChartData={rawChartData}
        startAge={startAge}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
