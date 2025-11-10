import Card from '@/components/ui/card';
import type { MultiSimulationPhasesChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import MultiSimulationPhasesAreaChart from '../../charts/multi-simulation/multi-simulation-phases-area-chart';

interface MultiSimulationPhasesAreaChartCardProps {
  rawChartData: MultiSimulationPhasesChartDataPoint[];
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  startAge: number;
}

export default function MultiSimulationPhasesAreaChartCard({
  rawChartData,
  onAgeSelect,
  selectedAge,
  startAge,
}: MultiSimulationPhasesAreaChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={4}>
          <span className="mr-2">Phases</span>
          <span className="text-muted-foreground hidden sm:inline">Time Series</span>
        </Subheading>
      </div>
      <MultiSimulationPhasesAreaChart rawChartData={rawChartData} startAge={startAge} onAgeSelect={onAgeSelect} selectedAge={selectedAge} />
    </Card>
  );
}
