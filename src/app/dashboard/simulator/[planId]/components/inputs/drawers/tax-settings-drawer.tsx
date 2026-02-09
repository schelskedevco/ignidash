'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import posthog from 'posthog-js';

import { taxSettingsToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { type TaxSettingsInputs, taxSettingsFormSchema } from '@/lib/schemas/inputs/tax-settings-form-schema';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Field, FieldGroup, Fieldset, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

interface TaxSettingsDrawerProps {
  setOpen: (open: boolean) => void;
  taxSettings: TaxSettingsInputs | null;
}

export default function TaxSettingsDrawer({ setOpen, taxSettings }: TaxSettingsDrawerProps) {
  const planId = useSelectedPlanId();

  const taxSettingsDefaultValues = useMemo(() => ({ filingStatus: 'single' }) as const satisfies TaxSettingsInputs, []);
  const defaultValues = taxSettings || taxSettingsDefaultValues;

  const {
    register,
    handleSubmit,
    reset,
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
                  <Description>Your filing status determines your tax rates and standard deduction.</Description>
                </Field>
                <Divider />
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
