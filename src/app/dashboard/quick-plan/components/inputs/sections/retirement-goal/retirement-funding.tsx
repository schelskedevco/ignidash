'use client';

import { BanknotesIcon } from '@heroicons/react/24/outline';

import NumberInput from '@/components/ui/number-input';
import DisclosureCard from '@/components/ui/disclosure-card';
import { useRetirementFundingData, useUpdateRetirementFunding } from '@/lib/stores/quick-plan-store';

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

export default function RetirementFunding() {
  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  return (
    <DisclosureCard
      title="Retirement Funding"
      desc="Portfolio withdrawals and income that will cover your retirement spending."
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
  );
}
