'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useController } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import posthog from 'posthog-js';

import { taxSettingsToConvex } from '@/lib/utils/data-transformers';
import { type TaxSettingsInputs, taxSettingsFormSchema } from '@/lib/schemas/inputs/tax-settings-form-schema';
import { ALL_STATES, stateLabel } from '@/lib/calc/state-taxes';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Field, FieldGroup, Fieldset, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Input } from '@/components/catalyst/input';
import { Checkbox, CheckboxField } from '@/components/catalyst/checkbox';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

interface TaxSettingsDrawerProps {
  setOpen: (open: boolean) => void;
  taxSettings: Partial<TaxSettingsInputs> | null;
}

export default function TaxSettingsDrawer({ setOpen, taxSettings }: TaxSettingsDrawerProps) {
  const planId = useSelectedPlanId();

  const taxSettingsDefaultValues = useMemo(
    () => ({ filingStatus: 'single' as const, numOnMedicare: 1, acaEnhancedSubsidies: true }),
    []
  );
  const defaultValues = { ...taxSettingsDefaultValues, ...taxSettings } satisfies TaxSettingsInputs;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taxSettingsFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (taxSettings) reset(taxSettings);
  }, [taxSettings, reset]);

  const m = useMutation(api.tax_settings.update);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { field: acaField } = useController({ name: 'acaEnhancedSubsidies', control });

  const onSubmit = async (data: TaxSettingsInputs) => {
    try {
      setSaveError(null);
      posthog.capture('save_tax_settings', { plan_id: planId });
      await m({ taxSettings: taxSettingsToConvex(data), planId });
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save tax settings.');
      console.error('Error saving tax settings: ', error);
    }
  };

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Tax Settings" desc="Manage settings that affect your tax calculations." />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="Tax settings details">
              <FieldGroup>
                {saveError && <ErrorMessageCard errorMessage={saveError} />}

                <Field>
                  <Label htmlFor="filingStatus">Filing Status</Label>
                  <Select {...register('filingStatus')} id="filingStatus" name="filingStatus">
                    <option value="single">Single</option>
                    <option value="marriedFilingJointly">Married Filing Jointly</option>
                    <option value="headOfHousehold">Head of Household</option>
                  </Select>
                  {errors.filingStatus && <ErrorMessage>{errors.filingStatus?.message}</ErrorMessage>}
                  <Description>Determines your tax rates, brackets, and standard deduction.</Description>
                </Field>

                <Divider />

                <Field>
                  <Label htmlFor="stateOfResidence">State of Residence</Label>
                  <Select {...register('stateOfResidence')} id="stateOfResidence" name="stateOfResidence">
                    <option value="">— Select a state —</option>
                    {ALL_STATES.map((code) => (
                      <option key={code} value={code}>
                        {stateLabel(code)}
                      </option>
                    ))}
                  </Select>
                  {errors.stateOfResidence && <ErrorMessage>{errors.stateOfResidence?.message}</ErrorMessage>}
                  <Description>Used to compute state income tax in the simulation (if applicable).</Description>
                </Field>

                <Divider />

                <Field>
                  <Label htmlFor="numOnMedicare">Number of People on Medicare</Label>
                  <Input
                    id="numOnMedicare"
                    type="number"
                    min={1}
                    max={2}
                    {...register('numOnMedicare', { valueAsNumber: true })}
                  />
                  {errors.numOnMedicare && <ErrorMessage>{errors.numOnMedicare?.message}</ErrorMessage>}
                  <Description>
                    How many people in your plan are enrolled in Medicare. Affects IRMAA surcharge calculations
                    (applied automatically at age 65+).
                  </Description>
                </Field>

                <Divider />

                <CheckboxField>
                  <Checkbox checked={acaField.value} onChange={acaField.onChange} name="acaEnhancedSubsidies" />
                  <Label htmlFor="acaEnhancedSubsidies">Enhanced ACA Subsidies</Label>
                  <Description>
                    When enabled (default), the simulation uses the current enhanced subsidy structure (ARP/IRA)
                    with no 400% FPL cliff. When disabled, the pre-2025 hard cliff applies — useful for
                    modeling scenarios after enhanced provisions expire.
                  </Description>
                </CheckboxField>

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
      </SectionContainer>
    </>
  );
}
