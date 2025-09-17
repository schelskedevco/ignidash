import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { SingleSimulationCategory } from '@/lib/types/single-simulation-category';

import SingleSimulationDataTable from '../tables/single-simulation-data-table';

interface SingleSimulationDataTableSectionProps {
  simulation: SimulationResult;
  currentCategory: SingleSimulationCategory;
}

export default function SingleSimulationDataTableSection({ simulation, currentCategory }: SingleSimulationDataTableSectionProps) {
  return (
    <SectionContainer showBottomBorder>
      <SingleSimulationDataTable simulation={simulation} currentCategory={currentCategory} />
    </SectionContainer>
  );
}
