'use client';

import { BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import DisclosureCard from '@/components/ui/disclosure-card';
import { useGoalsData, useUpdateGoals, useRetirementFundingData, useUpdateRetirementFunding } from '@/lib/stores/quick-plan-store';

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

function getLifeExpectancyDescription() {
  return (
    <>
      Your best guess at longevity.{' '}
      <a
        href="https://www.cdc.gov/nchs/fastats/life-expectancy.htm"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        US average: 78 years
      </a>
      .
    </>
  );
}

export default function GoalSection() {
  const goals = useGoalsData();
  const updateGoals = useUpdateGoals();

  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

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
      <DisclosureCard
        title="Retirement Funding"
        desc="Portfolio withdrawals and income sources that will cover your retirement spending."
        icon={BanknotesIcon}
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Retirement funding configuration</legend>
            <NumberInput
              id="safe-withdrawal-rate"
              label="Safe Withdrawal Rate (%)"
              value={retirementFunding.safeWithdrawalRate}
              onBlur={(value) => updateRetirementFunding('safeWithdrawalRate', value)}
              inputMode="decimal"
              placeholder="4%"
              suffix="%"
              desc={getSafeWithdrawalRateDescription()}
            />
            <NumberInput
              id="retirement-income"
              label="Passive Retirement Income"
              value={retirementFunding.retirementIncome}
              onBlur={(value) => updateRetirementFunding('retirementIncome', value)}
              inputMode="decimal"
              placeholder="$0"
              prefix="$"
              desc="Gross annual income from Social Security, pensions, or annuities in today's dollars, starting at age 62."
            />
          </fieldset>
        </form>
      </DisclosureCard>
      <DisclosureCard
        title="Death & Taxes"
        desc="Life expectancy and tax assumptions that affect retirement planning."
        icon={DocumentTextIcon}
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Life expectancy and tax planning assumptions</legend>
            <NumberInput
              id="life-expectancy"
              label="Life Expectancy (years)"
              value={retirementFunding.lifeExpectancy}
              onBlur={(value) => updateRetirementFunding('lifeExpectancy', value)}
              inputMode="numeric"
              placeholder="85"
              decimalScale={0}
              desc={getLifeExpectancyDescription()}
            />
            <NumberInput
              id="effective-tax-rate"
              label="Retirement Tax Rate (%)"
              value={retirementFunding.effectiveTaxRate}
              onBlur={(value) => updateRetirementFunding('effectiveTaxRate', value)}
              inputMode="decimal"
              placeholder="15%"
              suffix="%"
              desc="Average effective tax rate on withdrawals and retirement income."
            />
          </fieldset>
        </form>
      </DisclosureCard>
    </SectionContainer>
  );
}
