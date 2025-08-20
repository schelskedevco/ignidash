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
import Card from '@/components/ui/card';
import SelectMenu from '@/components/ui/select-menu';
import { DialogTitle, DialogBody } from '@/components/catalyst/dialog';
// import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
// import { Divider } from '@/components/catalyst/divider';
// import { Select } from '@/components/catalyst/select';

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
      simulationModeDesc = 'Runs many simulations with your Average Returns assumptions to show success probability.';
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
      <DialogBody>
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">Simulation methodology</legend>
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
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Data storage configuration</legend>
            <Card>
              <SelectMenu
                id="data-storage"
                label="Data Persistence"
                value={preferences.dataStorage}
                onChange={(e) => updatePreferences('dataStorage', e.target.value)}
                options={[
                  { value: 'localStorage', label: 'Local Storage' },
                  { value: 'none', label: 'No Data Persistence' },
                ]}
                desc="Save your data locally on this device, or work without saving between sessions."
              />
            </Card>
            <Card>
              <Button
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
                {isDeleting ? 'Deleting...' : 'Delete Saved Data'}
              </Button>
              <p className="text-muted-foreground mt-2 text-sm">This will permanently delete all saved data and reset to defaults.</p>
            </Card>
          </fieldset>
        </form>
      </DialogBody>
    </>
  );
}
