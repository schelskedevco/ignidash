'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, HomeIcon, WeightIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller } from 'react-hook-form';
import posthog from 'posthog-js';

import { useTimelineData } from '@/hooks/use-convex-data';
import { physicalAssetToConvex } from '@/lib/utils/convex-to-zod-transformers';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { physicalAssetFormSchema, type PhysicalAssetInputs } from '@/lib/schemas/inputs/physical-asset-form-schema';
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

interface PhysicalAssetDialogProps {
  onClose: () => void;
  selectedPhysicalAsset: PhysicalAssetInputs | null;
  numPhysicalAssets: number;
}

export default function PhysicalAssetDialog({
  onClose,
  selectedPhysicalAsset: _selectedPhysicalAsset,
  numPhysicalAssets,
}: PhysicalAssetDialogProps) {
  const planId = useSelectedPlanId();
  const [selectedPhysicalAsset] = useState(_selectedPhysicalAsset);

  const newAssetDefaultValues = useMemo(
    () =>
      ({
        id: '',
        name: 'Asset ' + (numPhysicalAssets + 1),
        purchaseDate: { type: 'now' },
        appreciationRate: 4,
        saleDate: undefined,
        financing: undefined,
      }) as const satisfies Partial<PhysicalAssetInputs>,
    [numPhysicalAssets]
  );

  const defaultValues = selectedPhysicalAsset || newAssetDefaultValues;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(physicalAssetFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.physical_asset.upsertPhysicalAsset);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: PhysicalAssetInputs) => {
    const assetId = data.id === '' ? uuidv4() : data.id;
    try {
      setSaveError(null);
      posthog.capture('save_physical_asset', { plan_id: planId, save_mode: selectedPhysicalAsset ? 'edit' : 'create' });
      await m({ physicalAsset: physicalAssetToConvex({ ...data, id: assetId }), planId });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save physical asset.');
      console.error('Error saving physical asset: ', error);
    }
  };

  const purchaseTimePoint = useWatch({ control, name: 'purchaseDate' });
  const purchaseDateType = purchaseTimePoint.type;

  const saleTimePoint = useWatch({ control, name: 'saleDate' });
  const saleDateType = saleTimePoint?.type;

  const financing = useWatch({ control, name: 'financing' });

  useEffect(() => {
    if (purchaseDateType !== 'customDate') {
      unregister('purchaseDate.month');
      unregister('purchaseDate.year');
    }

    if (purchaseDateType !== 'customAge') {
      unregister('purchaseDate.age');
    }

    if (saleDateType !== 'customDate') {
      unregister('saleDate.month');
      unregister('saleDate.year');
    }

    if (saleDateType !== 'customAge') {
      unregister('saleDate.age');
    }
  }, [purchaseDateType, saleDateType, unregister]);

  const getDateColSpan = (type: string | undefined) => {
    if (type === 'customDate') return 'col-span-2';
    if (type === 'customAge') return 'col-span-1';
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

  const timeFrameButtonRef = useRef<HTMLButtonElement>(null);
  const financingButtonRef = useRef<HTMLButtonElement>(null);

  const [activeDisclosure, setActiveDisclosure] = useState<DisclosureState | null>(null);
  const toggleDisclosure = useCallback(
    (newDisclosure: DisclosureState) => {
      if (activeDisclosure?.open && activeDisclosure.key !== newDisclosure.key) {
        let targetRef = undefined;
        switch (newDisclosure.key) {
          case 'timeframe':
            targetRef = timeFrameButtonRef.current;
            break;
          case 'financing':
            targetRef = financingButtonRef.current;
            break;
        }

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
          <HomeIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedPhysicalAsset ? 'Edit Physical Asset' : 'New Physical Asset'}</span>
        </div>
      </DialogTitle>
      <DialogDescription className="hidden sm:block">Model real estate, vehicles, or other physical assets.</DialogDescription>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Physical asset details">
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
                    placeholder="My Primary Residence"
                    autoComplete="off"
                    inputMode="text"
                    invalid={!!errors.name}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
                </Field>
                <Field>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <NumberInput
                    name="purchasePrice"
                    control={control}
                    id="purchasePrice"
                    inputMode="decimal"
                    placeholder="$460,000"
                    prefix="$"
                    autoFocus
                  />
                  {errors.purchasePrice && <ErrorMessage>{errors.purchasePrice?.message}</ErrorMessage>}
                </Field>
                <Field>
                  <Label htmlFor="marketValue" className="flex w-full items-center justify-between">
                    <span className="whitespace-nowrap">Market Value</span>
                    <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                  </Label>
                  <NumberInput
                    name="marketValue"
                    control={control}
                    id="marketValue"
                    inputMode="decimal"
                    placeholder="$525,000"
                    prefix="$"
                  />
                  {errors.marketValue && <ErrorMessage>{errors.marketValue?.message}</ErrorMessage>}
                </Field>
                <Field className="col-span-2">
                  <Label htmlFor="appreciationRate">Real Annual Appreciation</Label>
                  <NumberInput
                    name="appreciationRate"
                    control={control}
                    id="appreciationRate"
                    inputMode="decimal"
                    placeholder="3%"
                    suffix="%"
                  />
                  {errors.appreciationRate && <ErrorMessage>{errors.appreciationRate?.message}</ErrorMessage>}
                </Field>
              </div>
              <Disclosure as="div" className="border-border/25 border-t pt-4">
                {({ open, close }) => (
                  <>
                    <DisclosureButton
                      ref={timeFrameButtonRef}
                      onClick={() => {
                        if (!open) close();
                        toggleDisclosure({ open, close, key: 'timeframe' });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          if (!open) close();
                          toggleDisclosure({ open, close, key: 'timeframe' });
                        }
                      }}
                      className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                        <span className="text-base/7 font-semibold">Timeframe</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="text-muted-foreground hidden truncate sm:inline">
                          {timeFrameForDisplay(purchaseTimePoint, saleTimePoint)}
                        </span>
                      </div>
                      <span className="text-muted-foreground ml-6 flex h-7 items-center">
                        <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                        <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                      </span>
                    </DisclosureButton>
                    <DisclosurePanel className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 grid grid-cols-2 items-end gap-x-4 gap-y-2">
                          <Field className={getDateColSpan(purchaseDateType)}>
                            <Label htmlFor="purchaseDate.type">Purchase Time</Label>
                            <Select {...register('purchaseDate.type')} id="purchaseDate.type" name="purchaseDate.type">
                              <option value="now">Already Owned</option>
                              <option value="atRetirement">At Retirement</option>
                              <option value="customDate">Custom Date</option>
                              <option value="customAge">Custom Age</option>
                            </Select>
                          </Field>
                          {purchaseDateType === 'customDate' && (
                            <>
                              <Field>
                                <Label className="sr-only">Month</Label>
                                <Controller
                                  name="purchaseDate.month"
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
                                  name="purchaseDate.year"
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
                          {purchaseDateType === 'customAge' && (
                            <Field>
                              <Label className="sr-only">Age</Label>
                              <Controller
                                name="purchaseDate.age"
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
                        <div className="col-span-2 grid grid-cols-2 items-end gap-x-4 gap-y-2">
                          <Field className={getDateColSpan(saleDateType)}>
                            <Label htmlFor="saleDate.type">Sale Time</Label>
                            <Select {...register('saleDate.type')} id="saleDate.type" name="saleDate.type">
                              <option value="atRetirement">At Retirement</option>
                              <option value="atLifeExpectancy">At Life Expectancy</option>
                              <option value="customDate">Custom Date</option>
                              <option value="customAge">Custom Age</option>
                            </Select>
                          </Field>
                          {saleDateType === 'customDate' && (
                            <>
                              <Field>
                                <Label className="sr-only">Month</Label>
                                <Controller
                                  name="saleDate.month"
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
                                  name="saleDate.year"
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
                          {saleDateType === 'customAge' && (
                            <Field>
                              <Label className="sr-only">Age</Label>
                              <Controller
                                name="saleDate.age"
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
                      </div>
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
              <Disclosure as="div" className="border-border/25 border-t pt-4">
                {({ open, close }) => (
                  <>
                    <DisclosureButton
                      ref={financingButtonRef}
                      onClick={() => {
                        if (!open) close();
                        toggleDisclosure({ open, close, key: 'financing' });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          if (!open) close();
                          toggleDisclosure({ open, close, key: 'financing' });
                        }
                      }}
                      className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4"
                    >
                      <div className="flex items-center gap-2">
                        <WeightIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                        <span className="text-base/7 font-semibold">Financing</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="text-muted-foreground hidden truncate sm:inline">
                          {financing !== undefined ? 'Financed' : 'Paid in Full'}
                        </span>
                      </div>
                      <span className="text-muted-foreground ml-6 flex h-7 items-center">
                        <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                        <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                      </span>
                    </DisclosureButton>
                    <DisclosurePanel className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <Label htmlFor="financing.downPayment">Down Payment</Label>
                          <NumberInput
                            name="financing.downPayment"
                            control={control}
                            id="financing.downPayment"
                            inputMode="decimal"
                            placeholder="$100,000"
                            prefix="$"
                          />
                          {errors.financing?.downPayment && <ErrorMessage>{errors.financing?.downPayment?.message}</ErrorMessage>}
                        </Field>
                        <Field>
                          <Label htmlFor="financing.loanAmount">Loan Amount</Label>
                          <NumberInput
                            name="financing.loanAmount"
                            control={control}
                            id="financing.loanAmount"
                            inputMode="decimal"
                            placeholder="$400,000"
                            prefix="$"
                          />
                          {errors.financing?.loanAmount && <ErrorMessage>{errors.financing?.loanAmount?.message}</ErrorMessage>}
                        </Field>
                        <Field>
                          <Label htmlFor="financing.apr">APR</Label>
                          <NumberInput
                            name="financing.apr"
                            control={control}
                            id="financing.apr"
                            inputMode="decimal"
                            placeholder="6%"
                            suffix="%"
                          />
                          {errors.financing?.apr && <ErrorMessage>{errors.financing?.apr?.message}</ErrorMessage>}
                        </Field>
                        <Field>
                          <Label htmlFor="financing.termMonths">Term (Months)</Label>
                          <NumberInput
                            name="financing.termMonths"
                            control={control}
                            id="financing.termMonths"
                            inputMode="numeric"
                            placeholder="360"
                          />
                          {errors.financing?.termMonths && <ErrorMessage>{errors.financing?.termMonths?.message}</ErrorMessage>}
                        </Field>
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
