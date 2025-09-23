'use client';

import { useMemo } from 'react';

import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Subheading } from '@/components/catalyst/heading';
import { formatNumber } from '@/lib/utils';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';

interface SingleSimulationDataListSectionProps {
  simulation: SimulationResult;
  selectedAge: number;
}

export default function SingleSimulationDataListSection({ simulation, selectedAge }: SingleSimulationDataListSectionProps) {
  const data = useMemo(() => {
    return simulation.data.find((dp) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(dp.date).getFullYear();

      return currDateYear - startDateYear + startAge === selectedAge;
    });
  }, [simulation, selectedAge]);

  if (!data) return null;

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader title={'Data List'} desc={'Data List Desc'} className="mb-4" />
      <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-2 @5xl:grid-cols-3">
        <Card>
          <Subheading level={4}>Order #1011</Subheading>
          <DescriptionList>
            <DescriptionTerm>Item 1</DescriptionTerm>
            <DescriptionDetails>{formatNumber(1000000, 2, '$')}</DescriptionDetails>

            <DescriptionTerm>Item 2</DescriptionTerm>
            <DescriptionDetails>{formatNumber(1000000, 2, '$')}</DescriptionDetails>
          </DescriptionList>
        </Card>
      </div>
    </SectionContainer>
  );
}
