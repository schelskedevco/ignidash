'use client';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import { useMarketAssumptionsData, useUpdateMarketAssumptions } from '@/lib/stores/quick-plan-store';

import ExpectedReturns from './expected-returns';

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

export default function FineTuneSection() {
  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  return (
    <>
      <SectionContainer showBottomBorder>
        <SectionHeader
          title="Fine-Tuning"
          desc="Modify default assumptions for more personalized retirement projections."
          status="complete"
        />
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
        <ExpectedReturns />
      </SectionContainer>
    </>
  );
}
