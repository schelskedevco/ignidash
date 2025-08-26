'use client';

import { RefObject } from 'react';
import { HandCoinsIcon } from 'lucide-react';

import DisclosureSection from '@/components/ui/disclosure-section';
import { DisclosureState } from '@/lib/types/disclosure-state';

interface ContributionsSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function ContributionsSection({ toggleDisclosure, disclosureButtonRef, disclosureKey }: ContributionsSectionProps) {
  return (
    <>
      <DisclosureSection
        title="Contributions"
        icon={HandCoinsIcon}
        centerPanelContent
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={disclosureButtonRef}
        disclosureKey={disclosureKey}
      >
        <p>Manage your contributions to different accounts.</p>
      </DisclosureSection>
    </>
  );
}
