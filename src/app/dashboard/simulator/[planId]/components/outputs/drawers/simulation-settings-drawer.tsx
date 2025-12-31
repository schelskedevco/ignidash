'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { simulationSettingsToConvex } from '@/lib/utils/convex-to-zod-transformers';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Select } from '@/components/catalyst/select';
import { Field, FieldGroup, Fieldset, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { type SimulationSettingsInputs, simulationSettingsSchema } from '@/lib/schemas/simulation-settings-schema';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Subheading } from '@/components/catalyst/heading';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

interface SimulationSettingsDrawerProps {
  setOpen: (open: boolean) => void;
  simulationSettings: SimulationSettingsInputs | null;
}

export default function SimulationSettingsDrawer({ setOpen, simulationSettings }: SimulationSettingsDrawerProps) {
  const planId = useSelectedPlanId();

  const simulationSettingsDefaultValues = useMemo(
    () => ({ simulationSeed: 9521, simulationMode: 'fixedReturns' }) as const satisfies SimulationSettingsInputs,
    []
  );

  const defaultValues = simulationSettings || simulationSettingsDefaultValues;

  const {
    control,
    register,
    unregister,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(simulationSettingsSchema),
    defaultValues,
  });

  useEffect(() => {
    if (simulationSettings) reset(simulationSettings);
  }, [simulationSettings, reset]);

  const m = useMutation(api.simulation_settings.update);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: SimulationSettingsInputs) => {
    try {
      setSaveError(null);
      track('Save simulation settings', { simulationMode: data.simulationMode });
      posthog.capture('save_simulation_settings', { simulationMode: data.simulationMode });
      await m({ simulationSettings: simulationSettingsToConvex(data), planId });
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save simulation settings.');
      console.error('Error saving simulation settings: ', error);
    }
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
        <SectionHeader title="Simulation Settings" desc="Choose your preferred simulation methodology for projections." />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="Simulation methodology details">
              <FieldGroup>
                {saveError && <ErrorMessageCard errorMessage={saveError} />}
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
                {simulationMode !== 'fixedReturns' && (
                  <Field>
                    <Label htmlFor="simulationSeed">Simulation Seed</Label>
                    <NumberInput
                      name="simulationSeed"
                      control={control}
                      id="simulationSeed"
                      inputMode="numeric"
                      placeholder="9521"
                      decimalScale={0}
                      step={1}
                      min={1}
                      max={9999}
                      disableThousandsSeparator
                    />
                    {errors.simulationSeed && <ErrorMessage>{errors.simulationSeed?.message}</ErrorMessage>}
                    <Description>
                      A fixed seed number to ensure reproducible results when using Stochastic or Historical simulations.
                    </Description>
                  </Field>
                )}
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
              <Button color="rose" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
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
