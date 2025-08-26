'use client';

import { HourglassIcon } from 'lucide-react';

import { useBasicsData, useUpdateBasics, useRetirementFundingData, useUpdateRetirementFunding } from '@/lib/stores/quick-plan-store';
import DisclosureSection from '@/components/ui/disclosure-section';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';

export default function TimelineSection() {
  const basics = useBasicsData();
  const updateBasics = useUpdateBasics();

  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  return (
    <DisclosureSection title="Timeline" icon={HourglassIcon}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Fieldset>
          <FieldGroup>
            <Field>
              <Label htmlFor="current-age">Age</Label>
              <NumberInput
                id="current-age"
                value={basics.currentAge}
                onBlur={(value) => updateBasics('currentAge', value)}
                inputMode="numeric"
                placeholder="28"
                decimalScale={0}
              />
              <Description>The age your simulation will start at.</Description>
            </Field>
            <Divider />
            <Field>
              <Label htmlFor="life-expectancy">Life Expectancy</Label>
              <NumberInput
                id="life-expectancy"
                value={retirementFunding.lifeExpectancy}
                onBlur={(value) => updateRetirementFunding('lifeExpectancy', value)}
                inputMode="numeric"
                placeholder="85"
                decimalScale={0}
              />
              <Description>The age your simulation will end at.</Description>
            </Field>
          </FieldGroup>
        </Fieldset>
      </form>
    </DisclosureSection>
  );
}
