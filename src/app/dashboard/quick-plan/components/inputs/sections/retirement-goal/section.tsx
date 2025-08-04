'use client';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import SectionHeader, { SectionStatus } from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import {
  useGoalsData,
  useUpdateGoals,
  useGoalsTouched,
  useGoalsHasErrors,
  useGoalsValidation,
  useRetirementFundingTouched,
  useRetirementFundingHasErrors,
} from '@/lib/stores/quick-plan-store';

import RetirementFunding from './retirement-funding';
import DeathTaxes from './death-taxes';

export default function GoalSection() {
  const goals = useGoalsData();
  const updateGoals = useUpdateGoals();

  const goalsAreTouched = useGoalsTouched();
  const retirementFundingTouched = useRetirementFundingTouched();
  const isTouched = goalsAreTouched || retirementFundingTouched;

  const goalsHasErrors = useGoalsHasErrors();
  const retirementFundingHasErrors = useRetirementFundingHasErrors();
  const hasErrors = goalsHasErrors || retirementFundingHasErrors;

  const goalsAreComplete = useGoalsValidation();

  let status: SectionStatus;
  if (goalsAreComplete) {
    status = hasErrors ? 'error' : 'complete';
  } else if (hasErrors) {
    status = 'error';
  } else if (isTouched) {
    status = 'in-progress';
  } else {
    status = 'not-started';
  }

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader
        title="Retirement Phase"
        desc="Your retirement spending level determines when you'll have enough to retire."
        status={status}
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
      <RetirementFunding />
      <DeathTaxes />
    </SectionContainer>
  );
}
