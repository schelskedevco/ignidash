'use client';

import { memo } from 'react';

import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { SimulationCategory } from '@/lib/types/simulation-category';

import SingleSimulationDataTable from '../tables/single-simulation-data-table';

interface SingleSimulationDataTableSectionProps {
  simulation: SimulationResult;
  currentCategory: SimulationCategory;
}

function SingleSimulationDataTableSection({ simulation, currentCategory }: SingleSimulationDataTableSectionProps) {
  const headerText = 'Yearly Results';
  const headerDesc = 'Year-by-year progression and outcome for this simulation.';

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader title={headerText} desc={headerDesc} className="mb-4" />
      <SingleSimulationDataTable simulation={simulation} currentCategory={currentCategory} />
    </SectionContainer>
  );
}

export default memo(SingleSimulationDataTableSection);
