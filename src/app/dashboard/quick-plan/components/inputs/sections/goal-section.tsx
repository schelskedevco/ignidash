'use client';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import { useGoalsData, useUpdateGoals } from '@/lib/stores/quick-plan-store';

export default function GoalSection() {
  const goals = useGoalsData();
  const updateGoals = useUpdateGoals();

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader
        title="Retirement Goal"
        desc="Your retirement spending level determines when you'll have enough to retire."
        status="complete"
      />
      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Retirement spending goal configuration</legend>
            <NumberInput
              id="retirement-expenses"
              label="Retirement Spending"
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
    </SectionContainer>
  );
}
