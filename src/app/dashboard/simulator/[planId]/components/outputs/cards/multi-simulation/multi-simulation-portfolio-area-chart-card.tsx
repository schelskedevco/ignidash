import Card from '@/components/ui/card';
import type { MultiSimulationPortfolioChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';
import type { KeyMetrics } from '@/lib/types/key-metrics';

import MultiSimulationPortfolioAreaChart from '../../charts/multi-simulation/multi-simulation-portfolio-area-chart';
import ChartTimeFrameDropdown from '../../chart-time-frame-dropdown';

interface MultiSimulationPortfolioAreaChartCardProps {
  rawChartData: MultiSimulationPortfolioChartDataPoint[];
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  startAge: number;
}

export default function MultiSimulationPortfolioAreaChartCard({
  rawChartData,
  keyMetrics,
  onAgeSelect,
  selectedAge,
  startAge,
}: MultiSimulationPortfolioAreaChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3}>
          <span className="mr-2">Portfolio</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <ChartTimeFrameDropdown timeFrameType="monteCarlo" />
      </div>
      <MultiSimulationPortfolioAreaChart
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        startAge={startAge}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
