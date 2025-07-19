'use client';

import { ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import DisclosureCard from '@/components/ui/disclosure-card';
import {
  useMarketAssumptionsData,
  useUpdateMarketAssumptions,
  useRetirementFundingData,
  useUpdateRetirementFunding,
} from '@/lib/stores/quick-plan-store';

function getInflationRateDescription() {
  return (
    <>
      Average annual cost of living increase.{' '}
      <a
        href="https://www.bls.gov/charts/consumer-price-index/consumer-price-index-by-category-line-chart.htm"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        Historical average: 3%
      </a>
      .
    </>
  );
}

function getExpectedReturnsDescription() {
  return (
    <>
      Expected nominal returns for each asset class based on{' '}
      <a
        href="https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        historical data
      </a>
      .
    </>
  );
}

function getSafeWithdrawalRateDescription() {
  return (
    <>
      Annual portfolio withdrawal percentage.{' '}
      <a
        href="https://www.investopedia.com/terms/f/four-percent-rule.asp"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        4% is standard
      </a>
      , and lower rates are more conservative.
    </>
  );
}

function getLifeExpectancyDescription() {
  return (
    <>
      Age you expect to live to. See{' '}
      <a
        href="https://www.cdc.gov/nchs/fastats/life-expectancy.htm"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        CDC life expectancy data
      </a>{' '}
      for current averages.
    </>
  );
}

function getEffectiveTaxRateDescription() {
  return (
    <>
      Estimated tax rate on retirement withdrawals. See{' '}
      <a
        href="https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-tax-on-early-distributions"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        IRS retirement tax guidance
      </a>{' '}
      for planning details. Affects after-tax income calculations.
    </>
  );
}

export default function FineTuneSection() {
  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  return (
    <>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Fine-Tuning" desc="Modify default assumptions for more personalized retirement projections." />
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">Economic factors for financial projections</legend>
              <NumberInput
                id="inflation-rate"
                label="Inflation Rate (%)"
                value={marketAssumptions.inflationRate}
                onBlur={(value) => updateMarketAssumptions('inflationRate', value)}
                inputMode="decimal"
                placeholder="3%"
                suffix="%"
                desc={getInflationRateDescription()}
              />
            </fieldset>
          </form>
        </Card>
        <div className="space-y-4">
          <DisclosureCard title="Expected Returns" desc={getExpectedReturnsDescription()} icon={ChartBarIcon}>
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="space-y-4">
                <legend className="sr-only">Expected investment returns configuration</legend>
                <NumberInput
                  id="stock-return"
                  label="Stock Returns (%)"
                  value={marketAssumptions.stockReturn}
                  onBlur={(value) => updateMarketAssumptions('stockReturn', value)}
                  inputMode="decimal"
                  placeholder="10%"
                  suffix="%"
                />
                <NumberInput
                  id="bond-return"
                  label="Bond Returns (%)"
                  value={marketAssumptions.bondReturn}
                  onBlur={(value) => updateMarketAssumptions('bondReturn', value)}
                  inputMode="decimal"
                  placeholder="5%"
                  suffix="%"
                />
                <NumberInput
                  id="cash-return"
                  label="Cash Returns (%)"
                  value={marketAssumptions.cashReturn}
                  onBlur={(value) => updateMarketAssumptions('cashReturn', value)}
                  inputMode="decimal"
                  placeholder="3%"
                  suffix="%"
                />
              </fieldset>
            </form>
          </DisclosureCard>
          <DisclosureCard
            title="Cash Flow"
            desc="Portfolio withdrawals and income sources that will cover your retirement expenses."
            icon={ChartBarIcon}
          >
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="space-y-4">
                <legend className="sr-only">Retirement cash flow planning settings</legend>
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
                  desc="Passive income sources in retirement like Social Security, pensions, or annuities. This helps estimate total retirement income beyond investment withdrawals."
                />
              </fieldset>
            </form>
          </DisclosureCard>
          <DisclosureCard
            title="Death & Taxes"
            desc="Life expectancy and tax assumptions that affect retirement planning."
            icon={ClockIcon}
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
                  label="Estimated Effective Tax Rate (%)"
                  value={retirementFunding.effectiveTaxRate}
                  onBlur={(value) => updateRetirementFunding('effectiveTaxRate', value)}
                  inputMode="decimal"
                  placeholder="15%"
                  suffix="%"
                  desc={getEffectiveTaxRateDescription()}
                />
              </fieldset>
            </form>
          </DisclosureCard>
        </div>
      </SectionContainer>
    </>
  );
}
