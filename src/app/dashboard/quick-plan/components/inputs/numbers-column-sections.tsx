import { CircleUserRoundIcon, LandmarkIcon, HandCoinsIcon, FileDigitIcon, ChartNoAxesColumnIncreasingIcon } from 'lucide-react';

import DisclosureSection from '@/components/ui/disclosure-section';

import BasicsSection from './sections/basics/section';
import GoalSection from './sections/retirement-goal/section';
import FineTuneSection from './sections/fine-tune/section';
// import FIREPathsSection from './sections/fire-paths/section';

export default function NumbersColumnSections() {
  return (
    <>
      <div className="divide-border divide-y">
        <DisclosureSection title="Basic Info" icon={CircleUserRoundIcon}>
          <p>Hello</p>
        </DisclosureSection>
        <DisclosureSection title="Portfolio" icon={LandmarkIcon}>
          <p>Hello</p>
        </DisclosureSection>
        <DisclosureSection title="Cash Flow" icon={HandCoinsIcon}>
          <p>Hello</p>
        </DisclosureSection>
        <DisclosureSection title="Withdrawal Strategy" icon={FileDigitIcon}>
          <p>Hello</p>
        </DisclosureSection>
        <DisclosureSection title="Simulation Settings" icon={ChartNoAxesColumnIncreasingIcon}>
          <p>Hello</p>
        </DisclosureSection>
      </div>
      <div className="h-lvh"></div>
      <BasicsSection />
      <GoalSection />
      <FineTuneSection />
      {/* <FIREPathsSection /> */}
    </>
  );
}
