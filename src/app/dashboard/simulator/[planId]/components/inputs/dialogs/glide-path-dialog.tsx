'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo, useState, useEffect } from 'react';
import { RouteIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller } from 'react-hook-form';
import posthog from 'posthog-js';

import { useTimelineData } from '@/hooks/use-convex-data';
import { formatNumber } from '@/lib/utils';
import { glidePathToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import { glidePathFormSchema, type GlidePathInputs } from '@/lib/schemas/inputs/glide-path-form-schema';
import { calculateAge } from '@/lib/schemas/inputs/timeline-form-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Combobox, ComboboxLabel, ComboboxOption } from '@/components/catalyst/combobox';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Switch, SwitchField } from '@/components/catalyst/switch';
import { Divider } from '@/components/catalyst/divider';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { getErrorMessages } from '@/lib/utils/form-utils';

interface GlidePathDialogProps {
  onClose: () => void;
  glidePath?: GlidePathInputs;
  accounts: AccountInputs[];
}

export default function GlidePathDialog({ onClose, glidePath: _glidePath, accounts }: GlidePathDialogProps) {
  const planId = useSelectedPlanId();
  const [glidePath] = useState(_glidePath);

  const { bonds: currBondAllocation } = useMemo(() => {
    const investmentAccounts = accounts.filter((account) => account.type !== 'savings');

    const totalBalance = investmentAccounts.reduce((acc, account) => acc + account.balance, 0);
    if (totalBalance === 0) return { stocks: 0, bonds: 0 };

    return investmentAccounts.reduce(
      (acc, account) => {
        const weight = account.balance / totalBalance;
        const percentBonds = (account.percentBonds ?? 0) / 100;

        return {
          stocks: acc.stocks + (1 - percentBonds) * weight,
          bonds: acc.bonds + percentBonds * weight,
        };
      },
      { stocks: 0, bonds: 0 }
    );
  }, [accounts]);

  const glidePathDefaultValues = useMemo(
    () =>
      ({
        id: '',
        endTimePoint: { type: 'customAge' as const, age: 65 },
        targetBondAllocation: currBondAllocation * 100,
      }) as const satisfies Partial<GlidePathInputs>,
    [currBondAllocation]
  );

  const defaultValues = glidePath || glidePathDefaultValues;

  const {
    control,
    register,
    unregister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(glidePathFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.glide_path.update);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: GlidePathInputs) => {
    const glidePathId = data.id === '' ? uuidv4() : data.id;
    try {
      setSaveError(null);
      posthog.capture('save_glide_path', { plan_id: planId, save_mode: glidePath ? 'edit' : 'create' });
      await m({ glidePath: glidePathToConvex({ ...data, id: glidePathId }), planId });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save glide path.');
      console.error('Error saving glide path: ', error);
    }
  };

  const endTimePoint = useWatch({ control, name: 'endTimePoint' });
  const endType = endTimePoint.type;

  const disabled = !useWatch({ control, name: 'enabled' });

  useEffect(() => {
    if (endType !== 'customDate') {
      unregister('endTimePoint.month');
      unregister('endTimePoint.year');
    }

    if (endType !== 'customAge') {
      unregister('endTimePoint.age');
    }
  }, [endType, unregister]);

  const getEndColSpan = () => {
    if (endType === 'customDate') return 'col-span-2';
    if (endType === 'customAge') return 'col-span-1';
    return 'col-span-2';
  };

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2100 - currentYear + 1 }, (_, i) => currentYear + i);

  const timeline = useTimelineData();
  const currentAge = timeline ? calculateAge(timeline.birthMonth, timeline.birthYear) : 18;
  const lifeExpectancy = timeline?.lifeExpectancy ?? 110;

  const ages = Array.from({ length: lifeExpectancy - currentAge + 1 }, (_, i) => currentAge + i);

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <RouteIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>Set Glide Path</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Glide path details">
          <DialogBody>
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
              <SwitchField>
                <Label>Enable glide path</Label>
                <Description>
                  Automatically rebalances toward your target bond allocation.{' '}
                  <span className="hidden sm:inline">Prioritizes tax-advantaged accounts when possible.</span>
                </Description>
                <Controller
                  name="enabled"
                  defaultValue={false}
                  control={control}
                  render={({ field: { onChange, value, name } }) => <Switch name={name} checked={value} onChange={onChange} />}
                />
              </SwitchField>
              <Divider soft />
              <div className="mt-4 grid grid-cols-2 items-end gap-x-4 gap-y-2">
                <Field className={getEndColSpan()} disabled={disabled}>
                  <Label htmlFor="endTimePoint.type">Glide Path End Time</Label>
                  <Select {...register('endTimePoint.type')} id="endTimePoint.type" name="endTimePoint.type">
                    <option value="customDate">Custom Date</option>
                    <option value="customAge">Custom Age</option>
                  </Select>
                </Field>
                {endType === 'customDate' && (
                  <>
                    <Field disabled={disabled}>
                      <Label className="sr-only">Month</Label>
                      <Controller
                        name="endTimePoint.month"
                        defaultValue={currentMonth.value}
                        control={control}
                        render={({ field: { onChange, value, name } }) => (
                          <Combobox
                            name={name}
                            options={months}
                            displayValue={(month) => month?.name || currentMonth.name}
                            value={months.find((m) => m.value === value) || currentMonth}
                            onChange={(month) => onChange(month?.value || currentMonth.value)}
                            filter={(month, query) =>
                              month.name.toLowerCase().includes(query.toLowerCase()) || String(month.value).includes(query)
                            }
                          >
                            {(month) => (
                              <ComboboxOption value={month}>
                                <ComboboxLabel>{month.name}</ComboboxLabel>
                              </ComboboxOption>
                            )}
                          </Combobox>
                        )}
                      />
                    </Field>
                    <Field disabled={disabled}>
                      <Label className="sr-only">Year</Label>
                      <Controller
                        name="endTimePoint.year"
                        defaultValue={currentYear}
                        control={control}
                        render={({ field: { onChange, value, name } }) => (
                          <Combobox
                            name={name}
                            options={years}
                            displayValue={(year) => String(year || currentYear)}
                            value={value || currentYear}
                            onChange={(year) => onChange(year || currentYear)}
                          >
                            {(year) => (
                              <ComboboxOption value={year}>
                                <ComboboxLabel>{year}</ComboboxLabel>
                              </ComboboxOption>
                            )}
                          </Combobox>
                        )}
                      />
                    </Field>
                  </>
                )}
                {endType === 'customAge' && (
                  <Field disabled={disabled}>
                    <Label className="sr-only">Age</Label>
                    <Controller
                      name="endTimePoint.age"
                      defaultValue={currentAge}
                      control={control}
                      render={({ field: { onChange, value, name } }) => (
                        <Combobox
                          name={name}
                          options={ages}
                          displayValue={(age) => String(age || currentAge) + ' y/o'}
                          value={value || currentAge}
                          onChange={(age) => onChange(age || currentAge)}
                        >
                          {(age) => (
                            <ComboboxOption value={age}>
                              <ComboboxLabel>{age}</ComboboxLabel>
                            </ComboboxOption>
                          )}
                        </Combobox>
                      )}
                    />
                  </Field>
                )}
              </div>
              <Field disabled={disabled}>
                <Label htmlFor="targetBondAllocation">Target Bond Allocation</Label>
                <NumberInput
                  name="targetBondAllocation"
                  control={control}
                  id="targetBondAllocation"
                  inputMode="decimal"
                  placeholder="30%"
                  suffix="%"
                />
                {errors.targetBondAllocation && <ErrorMessage>{errors.targetBondAllocation?.message}</ErrorMessage>}
                <Description>
                  Your starting portfolio-wide bond allocation is <strong>{formatNumber(currBondAllocation * 100, 1)}%</strong>.
                </Description>
              </Field>
            </FieldGroup>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={onClose} className="hidden sm:inline-flex" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button color="rose" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}
