import Card from '@/components/ui/card';
import type { MultiSimulationPhasesChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';
import type { KeyMetrics } from '@/lib/types/key-metrics';

import MultiSimulationPhasesAreaChart from '../../charts/multi-simulation/multi-simulation-phases-area-chart';
import ChartTimeFrameDropdown from '../../chart-time-frame-dropdown';

interface MultiSimulationPhasesAreaChartCardProps {
  rawChartData: MultiSimulationPhasesChartDataPoint[];
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  startAge: number;
}

export default function MultiSimulationPhasesAreaChartCard({
  rawChartData,
  keyMetrics,
  onAgeSelect,
  selectedAge,
  startAge,
}: MultiSimulationPhasesAreaChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3}>
          <span className="mr-2">Phases</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
        <ChartTimeFrameDropdown timeFrameType="monteCarlo" />
      </div>
      <MultiSimulationPhasesAreaChart
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        startAge={startAge}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
      />
    </Card>
  );
}
