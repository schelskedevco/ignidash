'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, CreditCardIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller } from 'react-hook-form';
import posthog from 'posthog-js';

import { useTimelineData } from '@/hooks/use-convex-data';
import { debtToConvex } from '@/lib/utils/convex-to-zod-transformers';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { debtFormSchema, type DebtInputs } from '@/lib/schemas/inputs/debt-form-schema';
import { calculateAge } from '@/lib/schemas/inputs/timeline-form-schema';
import { timeFrameForDisplay } from '@/lib/utils/data-display-formatters';
import { DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import NumberInput from '@/components/ui/number-input';
import { Field, Fieldset, FieldGroup, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Combobox, ComboboxLabel, ComboboxOption } from '@/components/catalyst/combobox';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { getErrorMessages } from '@/lib/utils/form-utils';
import { Divider } from '@/components/catalyst/divider';

interface DebtDialogProps {
  onClose: () => void;
  selectedDebt: DebtInputs | null;
  numDebts: number;
}

export default function DebtDialog({ onClose, selectedDebt: _selectedDebt, numDebts }: DebtDialogProps) {
  const planId = useSelectedPlanId();
  const [selectedDebt] = useState(_selectedDebt);

  const newDebtDefaultValues = useMemo(
    () =>
      ({
        id: '',
        name: 'Debt ' + (numDebts + 1),
        apr: 24,
        interestType: 'compound',
        compoundingFrequency: 'daily',
        startDate: { type: 'now' },
      }) as const satisfies Partial<DebtInputs>,
    [numDebts]
  );

  const defaultValues = selectedDebt || newDebtDefaultValues;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(debtFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.debt.upsertDebt);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: DebtInputs) => {
    const debtId = data.id === '' ? uuidv4() : data.id;
    try {
      setSaveError(null);
      posthog.capture('save_debt', { plan_id: planId, save_mode: selectedDebt ? 'edit' : 'create' });
      await m({ debt: debtToConvex({ ...data, id: debtId }), planId });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save debt.');
      console.error('Error saving debt: ', error);
    }
  };

  const interestType = useWatch({ control, name: 'interestType' });

  const startTimePoint = useWatch({ control, name: 'startDate' });
  const startType = startTimePoint.type;

  useEffect(() => {
    if (interestType !== 'compound') {
      unregister('compoundingFrequency');
    }

    if (startType !== 'customDate') {
      unregister('startDate.month');
      unregister('startDate.year');
    }

    if (startType !== 'customAge') {
      unregister('startDate.age');
    }
  }, [interestType, startType, unregister]);

  const getStartColSpan = () => {
    if (startType === 'customDate') return 'col-span-2';
    if (startType === 'customAge') return 'col-span-1';
    return 'col-span-2';
  };

  const getInterestTypeColSpan = () => {
    if (interestType === 'simple') return 'col-span-2';
    return 'col-span-1';
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

  const startDateButtonRef = useRef<HTMLButtonElement>(null);

  const [activeDisclosure, setActiveDisclosure] = useState<DisclosureState | null>(null);
  const toggleDisclosure = useCallback(
    (newDisclosure: DisclosureState) => {
      if (activeDisclosure?.open && activeDisclosure.key !== newDisclosure.key) {
        const targetRef = newDisclosure.key === 'startDate' ? startDateButtonRef.current : undefined;
        activeDisclosure.close(targetRef || undefined);
      }

      setActiveDisclosure({
        ...newDisclosure,
        open: !newDisclosure.open,
      });
    },
    [activeDisclosure]
  );

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <CreditCardIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedDebt ? 'Edit Debt' : 'New Debt'}</span>
        </div>
      </DialogTitle>
      <DialogDescription className="hidden sm:block">
        Any unsecured debt you have or expect to incur during your lifetime.
      </DialogDescription>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Debt details">
          <DialogBody className="sm:mt-4">
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
              <Divider soft className="hidden sm:block" />
              <div className="grid grid-cols-2 gap-4">
                <Field className="col-span-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    {...register('name')}
                    id="name"
                    name="name"
                    placeholder="My Credit Card"
                    autoComplete="off"
                    inputMode="text"
                    invalid={!!errors.name}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
                </Field>
                <Field>
                  <Label htmlFor="balance">Balance</Label>
                  <NumberInput
                    name="balance"
                    control={control}
                    id="balance"
                    inputMode="decimal"
                    placeholder="$7,500"
                    prefix="$"
                    autoFocus
                  />
                  {errors.balance && <ErrorMessage>{errors.balance?.message}</ErrorMessage>}
                </Field>
                <Field>
                  <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                  <NumberInput
                    name="monthlyPayment"
                    control={control}
                    id="monthlyPayment"
                    inputMode="decimal"
                    placeholder="$500"
                    prefix="$"
                  />
                  {errors.monthlyPayment && <ErrorMessage>{errors.monthlyPayment?.message}</ErrorMessage>}
                </Field>
                <Field className="col-span-2">
                  <Label htmlFor="apr">APR</Label>
                  <NumberInput name="apr" control={control} id="apr" inputMode="decimal" placeholder="24%" suffix="%" />
                  {errors.apr && <ErrorMessage>{errors.apr?.message}</ErrorMessage>}
                </Field>
                <Field className={getInterestTypeColSpan()}>
                  <Label htmlFor="interestType">Interest Type</Label>
                  <Select {...register('interestType')} id="interestType" name="interestType">
                    <option value="simple">Simple</option>
                    <option value="compound">Compound</option>
                  </Select>
                  {errors.interestType && <ErrorMessage>{errors.interestType?.message}</ErrorMessage>}
                </Field>
                {interestType === 'compound' && (
                  <Field>
                    <Label htmlFor="compoundingFrequency">Compounding Frequency</Label>
                    <Select {...register('compoundingFrequency')} id="compoundingFrequency" name="compoundingFrequency">
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                    {errors.compoundingFrequency && <ErrorMessage>{errors.compoundingFrequency?.message}</ErrorMessage>}
                  </Field>
                )}
              </div>
              <Disclosure as="div" className="border-border/25 border-t pt-4">
                {({ open, close }) => (
                  <>
                    <DisclosureButton
                      ref={startDateButtonRef}
                      onClick={() => {
                        if (!open) close();
                        toggleDisclosure({ open, close, key: 'startDate' });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          if (!open) close();
                          toggleDisclosure({ open, close, key: 'startDate' });
                        }
                      }}
                      className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                        <span className="text-base/7 font-semibold">Timeframe</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="text-muted-foreground hidden truncate sm:inline">{timeFrameForDisplay(startTimePoint)}</span>
                      </div>
                      <span className="text-muted-foreground ml-6 flex h-7 items-center">
                        <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                        <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                      </span>
                    </DisclosureButton>
                    <DisclosurePanel className="pt-4">
                      <div className="grid grid-cols-2 items-end gap-x-4 gap-y-2">
                        <Field className={getStartColSpan()}>
                          <Label htmlFor="startDate.type">Start Time</Label>
                          <Select {...register('startDate.type')} id="startDate.type" name="startDate.type">
                            <option value="now">Now</option>
                            <option value="atRetirement">At Retirement</option>
                            <option value="customDate">Custom Date</option>
                            <option value="customAge">Custom Age</option>
                          </Select>
                        </Field>
                        {startType === 'customDate' && (
                          <>
                            <Field>
                              <Label className="sr-only">Month</Label>
                              <Controller
                                name="startDate.month"
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
                            <Field>
                              <Label className="sr-only">Year</Label>
                              <Controller
                                name="startDate.year"
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
                        {startType === 'customAge' && (
                          <Field>
                            <Label className="sr-only">Age</Label>
                            <Controller
                              name="startDate.age"
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
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
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
