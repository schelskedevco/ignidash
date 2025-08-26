'use client';

// import { useState } from 'react';

// import { Button } from '@/components/catalyst/button';
import {
  // usePreferencesData,
  // useUpdatePreferences,
  // useResetStore,
  useMarketAssumptionsData,
  useUpdateMarketAssumptions,
  useStocksRealReturn,
  useBondsRealReturn,
  useCashRealReturn,
} from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import { Select } from '@/components/catalyst/select';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';

export default function PreferencesDrawer() {
  // const [isDeleting, setIsDeleting] = useState(false);

  // const preferences = usePreferencesData();
  // const updatePreferences = useUpdatePreferences();
  // const resetStore = useResetStore();

  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  const stocksRealReturn = useStocksRealReturn();
  const bondsRealReturn = useBondsRealReturn();
  const cashRealReturn = useCashRealReturn();

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
      <SectionContainer showBottomBorder location="drawer">
        <SectionHeader title="Simulation Settings" />
        <Card>
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
        </Card>
      </SectionContainer>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Expected Returns" />
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <Fieldset aria-label="Expected Returns">
              <FieldGroup>
                <Field>
                  <Label htmlFor="stock-return" className="flex w-full items-center justify-between">
                    <span>Stock Return</span>
                    <span className="text-muted-foreground text-sm/6">{stocksRealReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput
                    id="stock-return"
                    value={marketAssumptions.stockReturn}
                    onBlur={(value) => updateMarketAssumptions('stockReturn', value)}
                    inputMode="decimal"
                    placeholder="10%"
                    suffix="%"
                  />
                  <Description>Expected annual return for stocks and other volatile investments.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="bond-return" className="flex w-full items-center justify-between">
                    <span>Bond Return</span>
                    <span className="text-muted-foreground text-sm/6">{bondsRealReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput
                    id="bond-return"
                    value={marketAssumptions.bondReturn}
                    onBlur={(value) => updateMarketAssumptions('bondReturn', value)}
                    inputMode="decimal"
                    placeholder="5%"
                    suffix="%"
                  />
                  <Description>Expected annual return for bonds.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="cash-return" className="flex w-full items-center justify-between">
                    <span>Cash Return</span>
                    <span className="text-muted-foreground text-sm/6">{cashRealReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput
                    id="cash-return"
                    value={marketAssumptions.cashReturn}
                    onBlur={(value) => updateMarketAssumptions('cashReturn', value)}
                    inputMode="decimal"
                    placeholder="3%"
                    suffix="%"
                  />
                  <Description>Expected annual interest rate for cash savings and money market accounts.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="inflation-rate" className="flex w-full items-center justify-between">
                    <span>Inflation Rate</span>
                    <span className="text-muted-foreground text-sm/6">—</span>
                  </Label>
                  <NumberInput
                    id="inflation-rate"
                    value={marketAssumptions.inflationRate}
                    onBlur={(value) => updateMarketAssumptions('inflationRate', value)}
                    inputMode="decimal"
                    placeholder="3%"
                    suffix="%"
                  />
                  <Description>Expected annual inflation rate, used to calculate real returns.</Description>
                </Field>
              </FieldGroup>
            </Fieldset>
          </form>
        </Card>
      </SectionContainer>
      {/* <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Data Storage" />
        <Card>
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
                <Divider />
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
                    className="w-full"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Description>This will permanently delete all saved data and reset to defaults.</Description>
                </Field>
              </FieldGroup>
            </Fieldset>
          </form>
        </Card>
      </SectionContainer> */}
    </>
  );
}
