'use client';

import { Coffee, RollerCoaster } from 'lucide-react';

import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import DisclosureCard from '@/components/ui/disclosure-card';
import { useFlexiblePathsData, useUpdateFlexiblePaths } from '@/lib/stores/quick-plan-store';

export default function FIREPathsSection() {
  const flexiblePaths = useFlexiblePathsData();
  const updateFlexiblePaths = useUpdateFlexiblePaths();

  return (
    <SectionContainer showBottomBorder={false}>
      <SectionHeader
        title="Flexible Paths"
        desc="Blend work and freedom in ways that fit your life. Explore if curious, skip if not."
        status="optional"
      />
      <DisclosureCard title="Coast FIRE" desc="Front-load savings, then work just enough to cover living expenses." icon={RollerCoaster}>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Coast FIRE target retirement age setting</legend>
            <NumberInput
              id="target-retirement-age"
              label={
                <div className="flex w-full items-center justify-between">
                  <span>Target Retirement Age</span>
                  <span className="text-muted-foreground text-sm/6">Optional</span>
                </div>
              }
              value={flexiblePaths.targetRetirementAge}
              onBlur={(value) => updateFlexiblePaths('targetRetirementAge', value)}
              inputMode="numeric"
              placeholder="65"
              decimalScale={0}
              desc="When you want to fully retire. Determines when you can stop saving and coast."
            />
          </fieldset>
        </form>
      </DisclosureCard>
      <DisclosureCard title="Barista FIRE" desc="Work part-time in enjoyable jobs while investments cover the rest." icon={Coffee}>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Barista FIRE part-time income configuration</legend>
            <NumberInput
              id="part-time-income"
              label={
                <div className="flex w-full items-center justify-between">
                  <span>Part-Time Income</span>
                  <span className="text-muted-foreground text-sm/6">Optional</span>
                </div>
              }
              value={flexiblePaths.partTimeIncome}
              onBlur={(value) => updateFlexiblePaths('partTimeIncome', value)}
              inputMode="decimal"
              placeholder="$18,000"
              prefix="$"
              desc="Expected gross annual income from part-time work in today's dollars."
            />
          </fieldset>
        </form>
      </DisclosureCard>
    </SectionContainer>
  );
}
