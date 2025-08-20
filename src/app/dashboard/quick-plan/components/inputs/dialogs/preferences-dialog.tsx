'use client';

import { useState } from 'react';

import { Button } from '@/components/catalyst/button';
import {
  usePreferencesData,
  useUpdatePreferences,
  useResetStore,
  useMarketAssumptionsData,
  useUpdateMarketAssumptions,
} from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody } from '@/components/catalyst/dialog';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';
import { Select } from '@/components/catalyst/select';

export default function PreferencesDialog() {
  const [isDeleting, setIsDeleting] = useState(false);

  const preferences = usePreferencesData();
  const updatePreferences = useUpdatePreferences();
  const resetStore = useResetStore();

  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  let simulationModeDesc;
  switch (marketAssumptions.simulationMode) {
    case 'fixedReturns':
      simulationModeDesc = 'Uses your Expected Returns assumptions for a single deterministic projection.';
      break;
    case 'monteCarlo':
      simulationModeDesc = 'Runs many simulations with your Expected Returns assumptions as averages to show success probability.';
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
      <DialogTitle>Preferences</DialogTitle>
      <DialogBody className="space-y-4">
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset aria-label="Simulation methodology">
            <FieldGroup>
              <Field>
                <Label htmlFor="simulation-mode">Simulation Mode</Label>
                <Select
                  id="simulation-mode"
                  name="simulation-mode"
                  value={marketAssumptions.simulationMode}
                  onChange={(e) => updateMarketAssumptions('simulationMode', e.target.value)}
                >
                  <option value="fixedReturns">Fixed Returns</option>
                  <option value="monteCarlo">Monte Carlo</option>
                  <option value="historicalBacktest">Historical Backtest</option>
                </Select>
                <Description>{simulationModeDesc}</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
        <Divider />
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset aria-label="Data storage configuration">
            <FieldGroup>
              <Field>
                <Label htmlFor="data-storage">Data Persistence</Label>
                <Select
                  id="data-storage"
                  name="data-storage"
                  value={preferences.dataStorage}
                  onChange={(e) => updatePreferences('dataStorage', e.target.value)}
                >
                  <option value="localStorage">Local Storage</option>
                  <option value="none">No Data Persistence</option>
                </Select>
                <Description>Save your data locally on this device, or work without saving between sessions.</Description>
              </Field>
              <Field>
                <Label>Delete Saved Data</Label>
                <Button
                  data-slot="control"
                  type="button"
                  color="red"
                  onClick={async () => {
                    setIsDeleting(true);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    resetStore();
                    setIsDeleting(false);
                  }}
                  className="focus-outline w-full"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Description>This will permanently delete all saved data and reset to defaults.</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DialogBody>
    </>
  );
}
