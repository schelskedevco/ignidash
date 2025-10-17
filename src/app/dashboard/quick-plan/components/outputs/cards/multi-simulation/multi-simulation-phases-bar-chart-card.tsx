import Card from '@/components/ui/card';
import type { MultiSimulationPhasesChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';

import MultiSimulationPhasesBarChart from '../../charts/multi-simulation/multi-simulation-phases-bar-chart';

interface MultiSimulationPhasesBarChartCardProps {
  selectedAge: number;
  rawChartData: MultiSimulationPhasesChartDataPoint[];
}

export default function MultiSimulationPhasesBarChartCard({ selectedAge, rawChartData }: MultiSimulationPhasesBarChartCardProps) {
  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={4}>
          <span className="mr-2">Simulations in Phase</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
      </div>
      <MultiSimulationPhasesBarChart age={selectedAge} rawChartData={rawChartData} />
    </Card>
  );
}
