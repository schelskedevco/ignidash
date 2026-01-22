'use client';

import { memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

import SingleSimulationDataTable from '../tables/single-simulation-data-table';

interface SingleSimulationDataTableSectionProps {
  simulation: SimulationResult;
}

function SingleSimulationDataTableSection({ simulation }: SingleSimulationDataTableSectionProps) {
  return (
    <SectionContainer showBottomBorder={false} className="mb-0">
      <SingleSimulationDataTable simulation={simulation} />
    </SectionContainer>
  );
}

export default memo(SingleSimulationDataTableSection);
