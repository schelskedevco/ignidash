import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Subheading } from '@/components/catalyst/heading';
import { formatNumber } from '@/lib/utils';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

interface SingleSimulationDataListSectionProps {
  simulation: SimulationResult;
}

export default function SingleSimulationDataListSection({ simulation }: SingleSimulationDataListSectionProps) {
  return (
    <SectionContainer showBottomBorder>
      <SectionHeader title={'Data List'} desc={'Data List Desc'} className="mb-4" />
      <Subheading level={4}>Order #1011</Subheading>
      <DescriptionList>
        <DescriptionTerm>Item 1</DescriptionTerm>
        <DescriptionDetails>{formatNumber(1000000, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Item 2</DescriptionTerm>
        <DescriptionDetails>{formatNumber(1000000, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </SectionContainer>
  );
}
