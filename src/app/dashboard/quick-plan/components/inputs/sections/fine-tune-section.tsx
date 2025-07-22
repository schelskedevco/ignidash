'use client';

import { ChartBarIcon, BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

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
  useStocksRealReturn,
  useBondsRealReturn,
  useCashRealReturn,
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

export default function FineTuneSection() {
  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  // Get real return rates
  const stocksRealReturn = useStocksRealReturn();
  const bondsRealReturn = useBondsRealReturn();
  const cashRealReturn = useCashRealReturn();

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
          <DisclosureCard title="Expected Returns" desc="Expected nominal returns for each asset class." icon={ChartBarIcon}>
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="space-y-4">
                <legend className="sr-only">Expected investment returns configuration</legend>
                <NumberInput
                  id="stock-return"
                  label={
                    <div className="flex w-full items-center justify-between">
                      <span>Stock Returns (%)</span>
                      <span className="text-muted-foreground text-sm/6">{stocksRealReturn.toFixed(1)}% real</span>
                    </div>
                  }
                  value={marketAssumptions.stockReturn}
                  onBlur={(value) => updateMarketAssumptions('stockReturn', value)}
                  inputMode="decimal"
                  placeholder="10%"
                  suffix="%"
                />
                <NumberInput
                  id="bond-return"
                  label={
                    <div className="flex w-full items-center justify-between">
                      <span>Bond Returns (%)</span>
                      <span className="text-muted-foreground text-sm/6">{bondsRealReturn.toFixed(1)}% real</span>
                    </div>
                  }
                  value={marketAssumptions.bondReturn}
                  onBlur={(value) => updateMarketAssumptions('bondReturn', value)}
                  inputMode="decimal"
                  placeholder="5%"
                  suffix="%"
                />
                <NumberInput
                  id="cash-return"
                  label={
                    <div className="flex w-full items-center justify-between">
                      <span>Cash Returns (%)</span>
                      <span className="text-muted-foreground text-sm/6">{cashRealReturn.toFixed(1)}% real</span>
                    </div>
                  }
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
            title="Retirement Cash Flow"
            desc="Portfolio withdrawals and income sources that will cover your retirement spending."
            icon={BanknotesIcon}
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
                  label="Estimated Effective Tax Rate (%)"
                  value={retirementFunding.effectiveTaxRate}
                  onBlur={(value) => updateRetirementFunding('effectiveTaxRate', value)}
                  inputMode="decimal"
                  placeholder="15%"
                  suffix="%"
                  desc="Average tax rate on withdrawals and retirement income. Typically 10-20%."
                />
              </fieldset>
            </form>
          </DisclosureCard>
        </div>
      </SectionContainer>
    </>
  );
}
