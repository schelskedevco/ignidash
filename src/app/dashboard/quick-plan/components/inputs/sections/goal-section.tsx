'use client';

import { Coffee, RollerCoaster } from 'lucide-react';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import DisclosureCard from '@/components/ui/disclosure-card';
import { useGoalsData, useUpdateGoals } from '@/lib/stores/quick-plan-store';

export default function GoalSection() {
  const goals = useGoalsData();
  const updateGoals = useUpdateGoals();

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader
        title="Retirement Goal"
        desc="Your retirement spending level determines when you'll have enough to retire. Consider optional strategies for getting there."
      />
      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Retirement spending goal configuration</legend>
            <NumberInput
              id="retirement-expenses"
              label="Retirement Expenses"
              value={goals.retirementExpenses}
              onBlur={(value) => updateGoals('retirementExpenses', value)}
              inputMode="decimal"
              placeholder="$50,000"
              prefix="$"
              desc="Annual retirement spending in today's dollars, excluding taxes."
            />
          </fieldset>
        </form>
      </Card>
      <DisclosureCard title="Coast FIRE" desc="Front-load savings, then work just enough to cover living expenses." icon={RollerCoaster}>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Coast FIRE target retirement age setting</legend>
            <NumberInput
              id="target-retirement-age"
              label="Target Retirement Age"
              value={goals.targetRetirementAge}
              onBlur={(value) => updateGoals('targetRetirementAge', value)}
              inputMode="numeric"
              placeholder="65"
              decimalScale={0}
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
              label="Part-Time Annual Income"
              value={goals.partTimeIncome}
              onBlur={(value) => updateGoals('partTimeIncome', value)}
              inputMode="decimal"
              placeholder="$18,000"
              prefix="$"
            />
          </fieldset>
        </form>
      </DisclosureCard>
    </SectionContainer>
  );
}
