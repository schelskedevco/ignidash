'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, HomeIcon, BanknoteArrowDownIcon, BanknoteXIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller } from 'react-hook-form';
import posthog from 'posthog-js';

import { useTimelineData } from '@/hooks/use-convex-data';
import { useAlreadySyncedIds } from '@/hooks/use-already-synced-ids';
import { useLinkableFinances } from '@/hooks/use-linkable-finances';
import { usePayoffEstimate } from '@/hooks/use-payoff-estimate';
import { physicalAssetToConvex } from '@/lib/utils/convex-to-zod-transformers';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { physicalAssetFormSchema, type PhysicalAssetInputs } from '@/lib/schemas/inputs/physical-asset-form-schema';
import { assetTypeForDisplay, type AssetInputs } from '@/lib/schemas/finances/asset-schema';
import { liabilityTypeForDisplay, type LiabilityInputs } from '@/lib/schemas/finances/liability-schema';
import { calculateAge } from '@/lib/schemas/inputs/timeline-form-schema';
import { physicalAssetTimeFrameForDisplay } from '@/lib/utils/data-display-formatters';
import { DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import NumberInput from '@/components/ui/number-input';
import { Field, Fieldset, FieldGroup, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Combobox, ComboboxLabel, ComboboxOption } from '@/components/catalyst/combobox';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { getErrorMessages } from '@/lib/utils/form-utils';
import { Divider } from '@/components/catalyst/divider';
import { getCurrencySymbol, formatCurrencyPlaceholder } from '@/lib/utils/format-currency';

import SyncWithNetWorthTrackerSelect from './sync-with-nw-tracker-select';
import { PayoffEstimate } from './payoff-estimate';

const LINKABLE_PHYSICAL_ASSET_TYPES: AssetInputs['type'][] = ['realEstate', 'vehicle', 'preciousMetals', 'other'];
const LINKABLE_SECURED_DEBT_TYPES: LiabilityInputs['type'][] = ['mortgage', 'autoLoan', 'other'];

interface PhysicalAssetDialogProps {
  onClose: () => void;
  selectedPhysicalAsset: PhysicalAssetInputs | null;
  physicalAssets: Record<string, PhysicalAssetInputs>;
  nwAssets: AssetInputs[] | null;
  nwLiabilities: LiabilityInputs[] | null;
}

export default function PhysicalAssetDialog({
  onClose,
  selectedPhysicalAsset: _selectedPhysicalAsset,
  physicalAssets,
  nwAssets,
  nwLiabilities,
}: PhysicalAssetDialogProps) {
  const planId = useSelectedPlanId();
  const [selectedPhysicalAsset] = useState(_selectedPhysicalAsset);
  const numPhysicalAssets = Object.keys(physicalAssets).length;

  const newAssetDefaultValues = useMemo(
    () =>
      ({
        id: '',
        name: 'Asset ' + (numPhysicalAssets + 1),
        assetType: 'other',
        purchaseDate: { type: 'now' },
        appreciationRate: 1,
        saleDate: { type: 'atLifeExpectancy' },
        paymentMethod: { type: 'cash' },
      }) as const satisfies Partial<PhysicalAssetInputs>,
    [numPhysicalAssets]
  );

  const defaultValues = selectedPhysicalAsset || newAssetDefaultValues;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    getFieldState,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(physicalAssetFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const { error: loanBalanceError } = getFieldState('paymentMethod.loanBalance');
  const { error: monthlyPaymentError } = getFieldState('paymentMethod.monthlyPayment');
  const { error: aprError } = getFieldState('paymentMethod.apr');
  const { error: downPaymentError } = getFieldState('paymentMethod.downPayment');

  const m = useMutation(api.physical_asset.upsertPhysicalAsset);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: PhysicalAssetInputs) => {
    const processedData = { ...data };
    processedData.marketValue ??= data.purchasePrice;

    const assetId = processedData.id === '' ? uuidv4() : processedData.id;
    try {
      setSaveError(null);
      posthog.capture('save_physical_asset', { plan_id: planId, save_mode: selectedPhysicalAsset ? 'edit' : 'create' });
      await m({ physicalAsset: physicalAssetToConvex({ ...processedData, id: assetId }), planId });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save physical asset.');
      console.error('Error saving physical asset: ', error);
    }
  };

  const purchaseTimePoint = useWatch({ control, name: 'purchaseDate' });
  const purchaseDateType = purchaseTimePoint.type;
  const showDownPaymentField = purchaseDateType !== 'now';

  const saleTimePoint = useWatch({ control, name: 'saleDate' });
  const saleDateType = saleTimePoint?.type;

  const assetType = useWatch({ control, name: 'assetType' });
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  const paymentMethodType = paymentMethod.type;

  const syncedAssetId = useWatch({ control, name: 'syncedAssetId' });
  const isAssetSynced = !!syncedAssetId;

  const alreadySyncedAssetIds = useAlreadySyncedIds(physicalAssets, 'syncedAssetId', selectedPhysicalAsset?.id);
  const linkableAssets = useLinkableFinances(nwAssets, alreadySyncedAssetIds, LINKABLE_PHYSICAL_ASSET_TYPES);

  const handleAssetSyncChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assetId = e.target.value;
    if (!assetId) {
      setValue('syncedAssetId', undefined);
      return;
    }

    const asset = linkableAssets.find((a) => a.id === assetId);
    if (!asset) return;

    setValue('syncedAssetId', asset.id);
    setValue('name', asset.name);
    setValue('marketValue', asset.value);
  };

  const syncedLiabilityId = useWatch({ control, name: 'syncedLiabilityId' });
  const isLiabilitySynced = !!syncedLiabilityId;

  const alreadySyncedLiabilityIds = useAlreadySyncedIds(physicalAssets, 'syncedLiabilityId', selectedPhysicalAsset?.id);
  const linkableLiabilities = useLinkableFinances(nwLiabilities, alreadySyncedLiabilityIds, LINKABLE_SECURED_DEBT_TYPES);

  const handleLiabilitySyncChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const liabilityId = e.target.value;
    if (!liabilityId) {
      setValue('syncedLiabilityId', undefined);
      return;
    }

    const liability = linkableLiabilities.find((l) => l.id === liabilityId);
    if (!liability) return;

    setValue('syncedLiabilityId', liability.id);
    setValue('paymentMethod.loanBalance', liability.balance);
  };

  const loanPayoffMonths = usePayoffEstimate(
    paymentMethodType === 'loan' &&
      !isNaN(Number(paymentMethod.loanBalance)) &&
      !isNaN(Number(paymentMethod.monthlyPayment)) &&
      !isNaN(Number(paymentMethod.apr))
      ? {
          balance: Number(paymentMethod.loanBalance),
          monthlyPayment: Number(paymentMethod.monthlyPayment),
          apr: Number(paymentMethod.apr),
          interestType: 'simple',
        }
      : null
  );

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

    if (paymentMethodType !== 'loan') {
      unregister('syncedLiabilityId');
      unregister('paymentMethod.downPayment');
      unregister('paymentMethod.loanBalance');
      unregister('paymentMethod.apr');
      unregister('paymentMethod.monthlyPayment');
    }

    if (!showDownPaymentField) {
      unregister('paymentMethod.downPayment');
    }
  }, [purchaseDateType, saleDateType, paymentMethodType, showDownPaymentField, unregister]);

  const getDateColSpan = (type: string | undefined) => {
    if (type === 'customDate') return 'col-span-2';
    if (type === 'customAge') return 'col-span-1';
    return 'col-span-2';
  };

  const getAPRColSpan = () => {
    if (showDownPaymentField) return 'col-span-1';
    return 'col-span-2';
  };

  const getNameColSpan = () => {
    if (linkableAssets.length === 0) return 'col-span-2';
    return 'col-span-1';
  };

  const getPaymentMethodColSpan = () => {
    if (paymentMethodType !== 'loan' || linkableLiabilities.length === 0) return 'col-span-2';
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

  const timeFrameButtonRef = useRef<HTMLButtonElement>(null);
  const paymentMethodButtonRef = useRef<HTMLButtonElement>(null);
  const taxTreatmentButtonRef = useRef<HTMLButtonElement>(null);

  const [activeDisclosure, setActiveDisclosure] = useState<DisclosureState | null>(null);
  const toggleDisclosure = useCallback(
    (newDisclosure: DisclosureState) => {
      if (activeDisclosure?.open && activeDisclosure.key !== newDisclosure.key) {
        let targetRef = undefined;
        switch (newDisclosure.key) {
          case 'timeframe':
            targetRef = timeFrameButtonRef.current;
            break;
          case 'paymentMethod':
            targetRef = paymentMethodButtonRef.current;
            break;
          case 'taxTreatment':
            targetRef = taxTreatmentButtonRef.current;
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
      <DialogDescription className="hidden sm:block">
        Any real estate, vehicle, or other physical asset you own or expect to acquire during your lifetime.
      </DialogDescription>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Physical asset details">
          <DialogBody className="sm:mt-4">
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
              <Divider soft className="hidden sm:block" />
              <div className="grid grid-cols-2 gap-4">
                <Field className={getNameColSpan()}>
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
                    readOnly={isAssetSynced}
                  />
                  {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
                </Field>
                <SyncWithNetWorthTrackerSelect
                  fieldId="syncedAssetId"
                  options={linkableAssets.map((a) => ({ id: a.id, label: `${a.name} | ${assetTypeForDisplay(a.type)}` }))}
                  value={syncedAssetId}
                  onChange={handleAssetSyncChange}
                />
                <Field>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <NumberInput
                    name="purchasePrice"
                    control={control}
                    id="purchasePrice"
                    inputMode="decimal"
                    placeholder={formatCurrencyPlaceholder(460000)}
                    prefix={getCurrencySymbol()}
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
                    placeholder={formatCurrencyPlaceholder(525000)}
                    prefix={getCurrencySymbol()}
                    readOnly={isAssetSynced}
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
                    placeholder="1%"
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
                          {physicalAssetTimeFrameForDisplay(purchaseTimePoint, saleTimePoint)}
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
                              <option value="atLifeExpectancy">Never Sold</option>
                              <option value="atRetirement">At Retirement</option>
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
                      ref={paymentMethodButtonRef}
                      onClick={() => {
                        if (!open) close();
                        toggleDisclosure({ open, close, key: 'paymentMethod' });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          if (!open) close();
                          toggleDisclosure({ open, close, key: 'paymentMethod' });
                        }
                      }}
                      className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4"
                    >
                      <div className="flex items-center gap-2">
                        <BanknoteArrowDownIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                        <span className="text-base/7 font-semibold">Payment</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="text-muted-foreground hidden truncate sm:inline">
                          {paymentMethod.type === 'loan' ? 'Financed' : 'Paid in Full'}
                        </span>
                      </div>
                      <span className="text-muted-foreground ml-6 flex h-7 items-center">
                        <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                        <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                      </span>
                    </DisclosureButton>
                    <DisclosurePanel className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field className={getPaymentMethodColSpan()}>
                          <Label htmlFor="paymentMethod.type">Payment Method</Label>
                          <Select {...register('paymentMethod.type')} id="paymentMethod.type" name="paymentMethod.type">
                            <option value="cash">Paid in Full</option>
                            <option value="loan">Financed</option>
                          </Select>
                        </Field>
                        {paymentMethod.type === 'loan' && (
                          <>
                            <SyncWithNetWorthTrackerSelect
                              fieldId="syncedLiabilityId"
                              options={linkableLiabilities.map((l) => ({
                                id: l.id,
                                label: `${l.name} | ${liabilityTypeForDisplay(l.type)}`,
                              }))}
                              value={syncedLiabilityId}
                              onChange={handleLiabilitySyncChange}
                            />
                            <Field>
                              <Label htmlFor="paymentMethod.loanBalance">Loan Balance</Label>
                              <NumberInput
                                name="paymentMethod.loanBalance"
                                control={control}
                                id="paymentMethod.loanBalance"
                                inputMode="decimal"
                                placeholder={formatCurrencyPlaceholder(400000)}
                                prefix={getCurrencySymbol()}
                                readOnly={isLiabilitySynced}
                              />
                              {loanBalanceError && <ErrorMessage>{loanBalanceError.message}</ErrorMessage>}
                            </Field>
                            <Field>
                              <Label htmlFor="paymentMethod.monthlyPayment">Monthly Payment</Label>
                              <NumberInput
                                name="paymentMethod.monthlyPayment"
                                control={control}
                                id="paymentMethod.monthlyPayment"
                                inputMode="decimal"
                                placeholder={formatCurrencyPlaceholder(2400)}
                                prefix={getCurrencySymbol()}
                              />
                              {monthlyPaymentError && <ErrorMessage>{monthlyPaymentError.message}</ErrorMessage>}
                            </Field>
                            <Field className={getAPRColSpan()}>
                              <Label htmlFor="paymentMethod.apr">APR</Label>
                              <NumberInput
                                name="paymentMethod.apr"
                                control={control}
                                id="paymentMethod.apr"
                                inputMode="decimal"
                                placeholder="6%"
                                suffix="%"
                              />
                              {aprError && <ErrorMessage>{aprError.message}</ErrorMessage>}
                            </Field>
                            {showDownPaymentField && (
                              <Field>
                                <Label htmlFor="paymentMethod.downPayment">Down Payment</Label>
                                <NumberInput
                                  name="paymentMethod.downPayment"
                                  control={control}
                                  id="paymentMethod.downPayment"
                                  inputMode="decimal"
                                  placeholder={formatCurrencyPlaceholder(100000)}
                                  prefix={getCurrencySymbol()}
                                />
                                {downPaymentError && <ErrorMessage>{downPaymentError.message}</ErrorMessage>}
                              </Field>
                            )}
                          </>
                        )}
                        <PayoffEstimate months={loanPayoffMonths} className="col-span-2" />
                      </div>
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
              <Disclosure as="div" className="border-border/25 border-t pt-4">
                {({ open, close }) => (
                  <>
                    <DisclosureButton
                      ref={taxTreatmentButtonRef}
                      onClick={() => {
                        if (!open) close();
                        toggleDisclosure({ open, close, key: 'taxTreatment' });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          if (!open) close();
                          toggleDisclosure({ open, close, key: 'taxTreatment' });
                        }
                      }}
                      className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4"
                    >
                      <div className="flex items-center gap-2">
                        <BanknoteXIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                        <span className="text-base/7 font-semibold">Taxes</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="text-muted-foreground hidden truncate sm:inline">
                          {assetType === 'primaryResidence' ? 'Primary Residence' : 'Not Primary Residence'}
                        </span>
                      </div>
                      <span className="text-muted-foreground ml-6 flex h-7 items-center">
                        <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                        <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                      </span>
                    </DisclosureButton>
                    <DisclosurePanel className="pt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <Field>
                          <Label htmlFor="assetType">Asset Type</Label>
                          <Select {...register('assetType')} id="assetType" name="assetType">
                            <option value="primaryResidence">Primary Residence</option>
                            <option value="other">Other</option>
                          </Select>
                          {errors.assetType && <ErrorMessage>{errors.assetType?.message}</ErrorMessage>}
                          <Description>
                            When sold, primary residences may qualify for the Section 121 exclusion, reducing capital gains taxes.
                          </Description>
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
