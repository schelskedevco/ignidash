import { HandCoinsIcon } from 'lucide-react';

import DisclosureSection from '@/components/ui/disclosure-section';

export default function ContributionsSection() {
  return (
    <>
      <DisclosureSection title="Contributions" icon={HandCoinsIcon}>
        <p>Manage your contributions to different accounts.</p>
      </DisclosureSection>
    </>
  );
}
