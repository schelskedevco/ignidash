'use client';

import { CircleUserRoundIcon, LandmarkIcon, HandCoinsIcon, ArmchairIcon, TrendingUpDownIcon } from 'lucide-react';

import { useBasicsData, useUpdateBasics, useRetirementFundingData, useUpdateRetirementFunding } from '@/lib/stores/quick-plan-store';
import DisclosureSection from '@/components/ui/disclosure-section';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label, Legend /* Description */ } from '@/components/catalyst/fieldset';
// import { Input } from '@/components/catalyst/input';
import { Text } from '@/components/catalyst/text';

import BasicsSection from './sections/basics/section';
import GoalSection from './sections/retirement-goal/section';
import FineTuneSection from './sections/fine-tune/section';

export default function NumbersColumnSections() {
  const basics = useBasicsData();
  const updateBasics = useUpdateBasics();

  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  return (
    <>
      <DisclosureSection title="Basic Info" icon={CircleUserRoundIcon} defaultOpen>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <Legend>I am basic info.</Legend>
            <Text>Your most basic of info.</Text>
            <FieldGroup>
              <Field>
                <Label>Age</Label>
                <NumberInput
                  id="current-age"
                  value={basics.currentAge}
                  onBlur={(value) => updateBasics('currentAge', value)}
                  inputMode="numeric"
                  placeholder="28"
                  decimalScale={0}
                />
              </Field>
              <Field>
                <Label>Life Expectancy</Label>
                <NumberInput
                  id="life-expectancy"
                  value={retirementFunding.lifeExpectancy}
                  onBlur={(value) => updateRetirementFunding('lifeExpectancy', value)}
                  inputMode="numeric"
                  placeholder="85"
                  decimalScale={0}
                />
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
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
    </>
  );
}
