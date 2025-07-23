'use client';

import { DocumentTextIcon } from '@heroicons/react/24/outline';

import NumberInput from '@/components/ui/number-input';
import DisclosureCard from '@/components/ui/disclosure-card';
import { useRetirementFundingData, useUpdateRetirementFunding } from '@/lib/stores/quick-plan-store';

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

export default function DeathTaxes() {
  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  return (
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
  );
}
