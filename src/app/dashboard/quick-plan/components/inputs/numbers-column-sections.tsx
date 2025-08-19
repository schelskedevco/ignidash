'use client';

import { CircleUserRoundIcon, LandmarkIcon, HandCoinsIcon, ArmchairIcon, TrendingUpDownIcon } from 'lucide-react';

import { useBasicsData, useUpdateBasics, useRetirementFundingData, useUpdateRetirementFunding } from '@/lib/stores/quick-plan-store';
import DisclosureSection from '@/components/ui/disclosure-section';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';

import BasicsSection from './sections/basics/section';
import GoalSection from './sections/retirement-goal/section';
import FineTuneSection from './sections/fine-tune/section';

function getSafeWithdrawalRateDescription() {
  return (
    <>
      Annual portfolio withdrawal percentage. The{' '}
      <a
        href="https://www.investopedia.com/terms/f/four-percent-rule.asp"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        4% rule
      </a>{' '}
      is standard.
    </>
  );
}

export default function NumbersColumnSections() {
  const basics = useBasicsData();
  const updateBasics = useUpdateBasics();

  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  return (
    <>
      <DisclosureSection title="Basic Info" icon={CircleUserRoundIcon} defaultOpen>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset aria-label="Age and life expectancy">
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
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset aria-label="Withdrawal strategy in retirement">
            <FieldGroup>
              <Field>
                <Label>Safe Withdrawal Rate</Label>
                <NumberInput
                  id="safe-withdrawal-rate"
                  value={retirementFunding.safeWithdrawalRate}
                  onBlur={(value) => updateRetirementFunding('safeWithdrawalRate', value)}
                  inputMode="decimal"
                  placeholder="4%"
                  suffix="%"
                />
                <Description className="mt-2">{getSafeWithdrawalRateDescription()}</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DisclosureSection>
      <DisclosureSection title="Assumptions" icon={TrendingUpDownIcon}>
        <p>I am assumptions.</p>
      </DisclosureSection>
      <BasicsSection />
      <GoalSection />
      <FineTuneSection />
    </>
  );
}
