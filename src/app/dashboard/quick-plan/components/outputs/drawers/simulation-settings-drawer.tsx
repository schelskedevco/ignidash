'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { useSimulationSettings, useUpdateSimulationSettings } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
import { type SimulationSettingsInputs, simulationSettingsSchema } from '@/lib/schemas/simulation-settings-schema';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';

interface SimulationSettingsDrawerProps {
  setOpen: (open: boolean) => void;
}

export default function SimulationSettingsDrawer({ setOpen }: SimulationSettingsDrawerProps) {
  const simulationSettings = useSimulationSettings();

  const { control, register, handleSubmit, reset } = useForm({
    resolver: zodResolver(simulationSettingsSchema),
    defaultValues: simulationSettings,
  });

  const updateSimulationSettings = useUpdateSimulationSettings();
  const onSubmit = (data: SimulationSettingsInputs) => {
    updateSimulationSettings({ ...data });
    setOpen(false);
  };

  const simulationMode = useWatch({ control, name: 'simulationMode' });

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
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="Simulation methodology">
              <FieldGroup>
                <Field>
                  <Label htmlFor="simulationMode">Simulation Mode</Label>
                  <Select {...register('simulationMode')} id="simulationMode" name="simulationMode">
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
                <Divider />
              </FieldGroup>
            </Fieldset>
            <DialogActions>
              <Button outline onClick={() => reset()}>
                Reset
              </Button>
              <Button color="rose" type="submit">
                Save
              </Button>
            </DialogActions>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
