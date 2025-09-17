'use client';

import { useSimulationMode, useUpdateSimulationMode } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';

export default function SimulationSettingsDrawer() {
  const simulationMode = useSimulationMode();
  const updateSimulationMode = useUpdateSimulationMode();

  let simulationModeDesc;
  switch (simulationMode) {
    case 'fixedReturns':
      simulationModeDesc = 'Uses your Expected Returns assumptions for a single deterministic projection.';
      break;
    case 'monteCarloStochasticReturns':
      simulationModeDesc = 'Uses your Expected Returns assumptions as averages to show success probability.';
      break;
    case 'monteCarloHistoricalReturns':
      simulationModeDesc = 'Uses actual historical market data from different starting years to show success probability.';
      break;
    case 'stochasticReturns':
      simulationModeDesc = 'Uses your Expected Returns assumptions as averages for one simulation with random returns.';
      break;
    case 'historicalReturns':
      simulationModeDesc = 'Uses actual historical market data from a single starting year for one simulation with historical returns.';
      break;
    default:
      simulationModeDesc = 'Select a simulation mode for projections.';
      break;
  }

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Simulation Settings" desc="Select your preferred simulation methodology for projections." />
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <Fieldset aria-label="Simulation methodology">
              <FieldGroup>
                <Field>
                  <Label htmlFor="simulation-mode">Simulation Mode</Label>
                  <Select
                    id="simulation-mode"
                    name="simulation-mode"
                    value={simulationMode}
                    onChange={(e) =>
                      updateSimulationMode(
                        e.target.value as
                          | 'fixedReturns'
                          | 'stochasticReturns'
                          | 'historicalReturns'
                          | 'monteCarloStochasticReturns'
                          | 'monteCarloHistoricalReturns'
                      )
                    }
                  >
                    <optgroup label="Single Simulation">
                      <option value="fixedReturns">Fixed Returns</option>
                      <option value="stochasticReturns">Stochastic Returns</option>
                      <option value="historicalReturns">Historical Returns</option>
                    </optgroup>
                    <optgroup label="Monte Carlo (1,000 Simulations)">
                      <option value="monteCarloStochasticReturns">Stochastic Returns</option>
                      <option value="monteCarloHistoricalReturns">Historical Returns</option>
                    </optgroup>
                  </Select>
                  <Description>{simulationModeDesc}</Description>
                </Field>
              </FieldGroup>
            </Fieldset>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
