'use client';

import { memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { SimulationCategory } from '@/lib/types/simulation-category';

import SingleSimulationDataTable from '../tables/single-simulation-data-table';

interface SingleSimulationDataTableSectionProps {
  simulation: SimulationResult;
  currentCategory: SimulationCategory;
}

function SingleSimulationDataTableSection({ simulation, currentCategory }: SingleSimulationDataTableSectionProps) {
  return (
    <SectionContainer showBottomBorder className="mb-8">
      <SingleSimulationDataTable simulation={simulation} currentCategory={currentCategory} />
    </SectionContainer>
  );
}

export default memo(SingleSimulationDataTableSection);
