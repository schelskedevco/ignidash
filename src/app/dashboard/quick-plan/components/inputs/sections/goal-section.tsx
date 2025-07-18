'use client';

import { Coffee, RollerCoaster } from 'lucide-react';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/section-header';
import DisclosureSection from '@/components/disclosure-section';
import { useGoalsData, useUpdateGoals } from '@/lib/stores/quick-plan-store';

export function GoalSection() {
  const goals = useGoalsData();
  const updateGoals = useUpdateGoals();

  return (
    <div className="border-border mb-5 border-b pb-5">
      <SectionHeader
        title="Retirement Goal"
        desc="Your retirement spending level determines when you'll have enough to retire. Consider optional strategies for getting there."
      />
      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset className="space-y-4">
          <legend className="sr-only">Retirement goal and strategy options</legend>
          <Card>
            <NumberInput
              id="retirement-expenses"
              label="Retirement Expenses"
              value={goals.retirementExpenses}
              onBlur={(value) => updateGoals('retirementExpenses', value)}
              inputMode="decimal"
              placeholder="$50,000"
              prefix="$"
            />
          </Card>
          <DisclosureSection
            title="Coast FIRE"
            desc="Front-load savings, then work just enough to cover living expenses."
            icon={RollerCoaster}
          >
            <NumberInput
              id="target-retirement-age"
              label="Target Retirement Age"
              value={goals.targetRetirementAge}
              onBlur={(value) => updateGoals('targetRetirementAge', value)}
              inputMode="numeric"
              placeholder="65"
              decimalScale={0}
            />
          </DisclosureSection>
          <DisclosureSection title="Barista FIRE" desc="Work part-time in enjoyable jobs while investments cover the rest." icon={Coffee}>
            <NumberInput
              id="part-time-income"
              label="Part-time Annual Income"
              value={goals.partTimeIncome}
              onBlur={(value) => updateGoals('partTimeIncome', value)}
              inputMode="decimal"
              placeholder="$18,000"
              prefix="$"
            />
          </DisclosureSection>
        </fieldset>
      </form>
    </div>
  );
}
