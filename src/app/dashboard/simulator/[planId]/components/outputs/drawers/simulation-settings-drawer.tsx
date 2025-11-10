'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { useSimulationSettings, useUpdateSimulationSettings } from '@/lib/stores/simulator-store';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import { Field, FieldGroup, Fieldset, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import { type SimulationSettingsInputs, simulationSettingsSchema } from '@/lib/schemas/simulation-settings-schema';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Subheading } from '@/components/catalyst/heading';

interface SimulationSettingsDrawerProps {
  setOpen: (open: boolean) => void;
}

export default function SimulationSettingsDrawer({ setOpen }: SimulationSettingsDrawerProps) {
  const simulationSettings = useSimulationSettings();

  const {
    control,
    register,
    unregister,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(simulationSettingsSchema),
    defaultValues: simulationSettings,
  });

  const updateSimulationSettings = useUpdateSimulationSettings();
  const onSubmit = (data: SimulationSettingsInputs) => {
    updateSimulationSettings({ ...data });
    setOpen(false);
  };

  const simulationMode = useWatch({ control, name: 'simulationMode' });

  useEffect(() => {
    if (simulationMode !== 'historicalReturns') {
      unregister('historicalStartYearOverride');
      unregister('historicalRetirementStartYearOverride');
    }
  }, [simulationMode, unregister]);

  let simulationModeDesc;
  switch (simulationMode) {
    case 'fixedReturns':
      simulationModeDesc = 'Uses your Expected Returns assumptions for a single deterministic projection.';
      break;
    case 'monteCarloStochasticReturns':
      simulationModeDesc = 'Uses your Expected Returns assumptions as mean values to show success probability.';
      break;
    case 'monteCarloHistoricalReturns':
      simulationModeDesc = 'Uses actual historical market data from different starting years to show success probability.';
      break;
    case 'stochasticReturns':
      simulationModeDesc = 'Uses your Expected Returns assumptions as mean values for one simulation with random returns.';
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
                    <optgroup label="Monte Carlo (500 Simulations)">
                      <option value="monteCarloStochasticReturns">Stochastic Returns</option>
                      <option value="monteCarloHistoricalReturns">Historical Returns</option>
                    </optgroup>
                  </Select>
                  <Description>{simulationModeDesc}</Description>
                </Field>
                <Divider />
                {simulationMode === 'historicalReturns' && (
                  <>
                    <Field>
                      <Label htmlFor="historicalStartYearOverride" className="flex w-full items-center justify-between">
                        <span className="whitespace-nowrap">Historical Start Year</span>
                        <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                      </Label>
                      <NumberInput
                        name="historicalStartYearOverride"
                        control={control}
                        id="historicalStartYearOverride"
                        inputMode="numeric"
                        placeholder="1929"
                        decimalScale={0}
                        disableThousandsSeparator
                      />
                      {errors.historicalStartYearOverride && <ErrorMessage>{errors.historicalStartYearOverride?.message}</ErrorMessage>}
                      <Description>Start your simulation from a specific historical year or leave blank to use a random year.</Description>
                    </Field>
                    <Divider />
                  </>
                )}
                {simulationMode === 'historicalReturns' && (
                  <>
                    <Field>
                      <Label htmlFor="historicalRetirementStartYearOverride" className="flex w-full items-center justify-between">
                        <span className="whitespace-nowrap">Historical Retirement Start Year</span>
                        <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                      </Label>
                      <NumberInput
                        name="historicalRetirementStartYearOverride"
                        control={control}
                        id="historicalRetirementStartYearOverride"
                        inputMode="numeric"
                        placeholder="2008"
                        decimalScale={0}
                        disableThousandsSeparator
                      />
                      {errors.historicalRetirementStartYearOverride && (
                        <ErrorMessage>{errors.historicalRetirementStartYearOverride?.message}</ErrorMessage>
                      )}
                      <Description>
                        Start your simulation&apos;s retirement from a specific historical year or leave blank to continue chronologically.
                        This is helpful for evaluating sequence of returns risk.
                      </Description>
                    </Field>
                    <Divider />
                  </>
                )}
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
        {(simulationMode === 'historicalReturns' || simulationMode === 'monteCarloHistoricalReturns') && (
          <Card className="mt-4">
            <Subheading level={4}>Notable Historical Years</Subheading>
            <DescriptionList>
              <DescriptionTerm>1929–1932</DescriptionTerm>
              <DescriptionDetails>Great Depression</DescriptionDetails>

              <DescriptionTerm>1966–1982</DescriptionTerm>
              <DescriptionDetails>Stagflation era</DescriptionDetails>

              <DescriptionTerm>1973–1974</DescriptionTerm>
              <DescriptionDetails>Oil crisis and recession</DescriptionDetails>

              <DescriptionTerm>2000–2002</DescriptionTerm>
              <DescriptionDetails>Dot-com bubble burst</DescriptionDetails>

              <DescriptionTerm>2008–2009</DescriptionTerm>
              <DescriptionDetails>Financial Crisis</DescriptionDetails>
            </DescriptionList>
          </Card>
        )}
      </SectionContainer>
    </>
  );
}
