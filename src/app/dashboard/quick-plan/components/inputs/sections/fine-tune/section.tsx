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

  let simulationModeDesc;
  switch (marketAssumptions.simulationMode) {
    case 'fixedReturns':
      simulationModeDesc = 'Uses your Expected Returns assumptions for a single deterministic projection.';
      break;
    case 'monteCarlo':
      simulationModeDesc = 'Runs hundreds of simulations with random but realistic market returns to show probability of success.';
      break;
    case 'historicalBacktest':
      simulationModeDesc = 'Tests your plan against actual historical market data from different starting years.';
      break;
    default:
      simulationModeDesc = 'Select a simulation mode for projections.';
      break;
  }

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
                desc={simulationModeDesc}
              />
            </fieldset>
          </form>
        </Card>
        <ExpectedReturns />
      </SectionContainer>
    </>
  );
}
