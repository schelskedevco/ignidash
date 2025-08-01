'use client';

import Card from '@/components/ui/card';
import SelectMenu from '@/components/ui/select-menu';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import { useMarketAssumptionsData, useUpdateMarketAssumptions, useMarketAssumptionsHasErrors } from '@/lib/stores/quick-plan-store';

import ExpectedReturns from './expected-returns';

export default function FineTuneSection() {
  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();
  const marketAssumptionsHasErrors = useMarketAssumptionsHasErrors();

  return (
    <>
      <SectionContainer showBottomBorder>
        <SectionHeader
          title="Fine-Tuning"
          desc="Modify default assumptions for more personalized retirement projections."
          status={marketAssumptionsHasErrors ? 'error' : 'complete'}
        />
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">Economic factors for financial projections</legend>
              <SelectMenu
                id="simulation-mode"
                label="Simulation Mode"
                value={marketAssumptions.simulationMode}
                onChange={(e) => updateMarketAssumptions('simulationMode', e.target.value)}
                options={[
                  { value: 'fixedReturns', label: 'Fixed Returns' },
                  { value: 'monteCarlo', label: 'Monte Carlo' },
                  { value: 'historicalBacktest', label: 'Historical Backtest' },
                ]}
              />
            </fieldset>
          </form>
        </Card>
        <ExpectedReturns />
      </SectionContainer>
    </>
  );
}
