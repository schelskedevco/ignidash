import { CircleUserRoundIcon, LandmarkIcon, HandCoinsIcon, ArmchairIcon, TrendingUpDownIcon } from 'lucide-react';

import DisclosureSection from '@/components/ui/disclosure-section';

import BasicsSection from './sections/basics/section';
import GoalSection from './sections/retirement-goal/section';
import FineTuneSection from './sections/fine-tune/section';
// import FIREPathsSection from './sections/fire-paths/section';

export default function NumbersColumnSections() {
  return (
    <>
      <DisclosureSection title="Basic Info" icon={CircleUserRoundIcon}>
        <p>I am basic info.</p>
      </DisclosureSection>
      <DisclosureSection title="Portfolio" icon={LandmarkIcon}>
        <p>I am portfolio.</p>
      </DisclosureSection>
      <DisclosureSection title="Cash Flow" icon={HandCoinsIcon}>
        <p>I am cash flow.</p>
      </DisclosureSection>
      <DisclosureSection title="Retirement" icon={ArmchairIcon}>
        <p>I am retirement.</p>
      </DisclosureSection>
      <DisclosureSection title="Assumptions" icon={TrendingUpDownIcon}>
        <p>I am assumptions.</p>
      </DisclosureSection>
      <div className="h-lvh"></div>
      <BasicsSection />
      <GoalSection />
      <FineTuneSection />
      {/* <FIREPathsSection /> */}
    </>
  );
}
