'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, BanknoteArrowDownIcon, TrendingUpIcon, BanknoteXIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller } from 'react-hook-form';

import type { DisclosureState } from '@/lib/types/disclosure-state';
import { useUpdateExpenses, useExpenseData, useExpensesData, useTimelineData } from '@/lib/stores/simulator-store';
import { expenseFormSchema, type ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';
import { timeFrameForDisplay, growthForDisplay, expenseTaxTreatmentForDisplay } from '@/lib/utils/data-display-formatters';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import NumberInput from '@/components/ui/number-input';
import { Field, Fieldset, FieldGroup, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import { Combobox, ComboboxLabel, ComboboxOption } from '@/components/catalyst/combobox';
import { Checkbox, CheckboxField } from '@/components/catalyst/checkbox';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface ExpenseDialogProps {
  onClose: () => void;
  selectedExpenseID: string | null;
}

export default function ExpenseDialog({ onClose, selectedExpenseID }: ExpenseDialogProps) {
  const existingExpenseData = useExpenseData(selectedExpenseID);

  const numExpenses = Object.entries(useExpensesData()).length;
  const newExpenseDefaultValues = useMemo(
    () =>
      ({
        name: 'Expense ' + (numExpenses + 1),
        id: '',
        frequency: 'yearly',
        timeframe: { start: { type: 'now' }, end: { type: 'atLifeExpectancy' } },
        growth: { growthRate: 0 },
        taxes: { taxDeductible: false },
      }) as const satisfies Partial<ExpenseInputs>,
    [numExpenses]
  );

  const defaultValues = existingExpenseData || newExpenseDefaultValues;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues,
  });

  const updateExpenses = useUpdateExpenses();
  const onSubmit = (data: ExpenseInputs) => {
    const expenseId = data.id === '' ? uuidv4() : data.id;
    updateExpenses({ ...data, id: expenseId, disabled: false });
    onClose();
  };

  const frequency = useWatch({ control, name: 'frequency' });

  const startTimePoint = useWatch({ control, name: 'timeframe.start' });
  const startType = startTimePoint.type;

  const endTimePoint = useWatch({ control, name: 'timeframe.end' });
  const endType = endTimePoint?.type;

  const growthRate = useWatch({ control, name: 'growth.growthRate' }) as number | undefined;
  const growthLimit = useWatch({ control, name: 'growth.growthLimit' }) as number | undefined;

  const taxDeductible = useWatch({ control, name: 'taxes.taxDeductible' }) as boolean;

  useEffect(() => {
    if (frequency === 'oneTime') {
      // Unregister end time point fields
      unregister('timeframe.end');
      unregister('timeframe.end.type');
      unregister('timeframe.end.age');
      unregister('timeframe.end.month');
      unregister('timeframe.end.year');

      // Unregister growth fields
      unregister('growth');
      unregister('growth.growthRate');
      unregister('growth.growthLimit');
    }

    if (startType !== 'customDate') {
      unregister('timeframe.start.month');
      unregister('timeframe.start.year');
    }

    if (startType !== 'customAge') {
      unregister('timeframe.start.age');
    }

    if (endType !== 'customDate') {
      unregister('timeframe.end.month');
      unregister('timeframe.end.year');
    }

    if (endType !== 'customAge') {
      unregister('timeframe.end.age');
    }
  }, [frequency, startType, endType, unregister]);

  const getStartColSpan = () => {
    if (startType === 'customDate') return 'col-span-2';
    if (startType === 'customAge') return 'col-span-1';
    return 'col-span-2';
  };

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
  const currentAge = timeline?.currentAge ?? 18;
  const lifeExpectancy = timeline?.lifeExpectancy ?? 110;

  const ages = Array.from({ length: lifeExpectancy - currentAge + 1 }, (_, i) => currentAge + i);

  const timeFrameButtonRef = useRef<HTMLButtonElement>(null);
  const rateOfChangeButtonRef = useRef<HTMLButtonElement>(null);
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
          case 'rateOfChange':
            targetRef = rateOfChangeButtonRef.current;
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
          <BanknoteArrowDownIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedExpenseID ? 'Edit Expense' : 'New Expense'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Expense details">
          <DialogBody>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field className="col-span-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    {...register('name')}
                    id="name"
                    name="name"
                    placeholder="My Living Expenses"
                    autoComplete="off"
                    inputMode="text"
                    invalid={!!errors.name}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
                </Field>
                <Field>
                  <Label htmlFor="amount">Amount</Label>
                  <NumberInput name="amount" control={control} id="amount" inputMode="decimal" placeholder="$50,000" prefix="$" autoFocus />
                  {errors.amount && <ErrorMessage>{errors.amount?.message}</ErrorMessage>}
                </Field>
                <Field>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select {...register('frequency')} id="frequency" name="frequency">
                    <option value="oneTime">One-time</option>
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="weekly">Weekly</option>
                  </Select>
                </Field>
              </div>
              <Disclosure as="div" className="border-border/50 border-t pt-4">
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
                          {timeFrameForDisplay(startTimePoint, endTimePoint)}
                        </span>
                      </div>
                      <span className="text-muted-foreground ml-6 flex h-7 items-center">
                        <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                        <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                      </span>
                    </DisclosureButton>
                    <DisclosurePanel className="pt-4">
                      <div className="grid grid-cols-2 items-end gap-x-4 gap-y-2">
                        <Field className={getStartColSpan()}>
                          <Label htmlFor="start">Start</Label>
                          <Select {...register('timeframe.start.type')} id="start" name="timeframe.start.type">
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
                                name="timeframe.start.month"
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
                                name="timeframe.start.year"
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
                              name="timeframe.start.age"
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
                      {frequency !== 'oneTime' && (
                        <div className="mt-4 grid grid-cols-2 items-end gap-x-4 gap-y-2">
                          <Field className={getEndColSpan()}>
                            <Label htmlFor="end">End</Label>
                            <Select {...register('timeframe.end.type')} id="end" name="timeframe.end.type">
                              <option value="atRetirement">At Retirement</option>
                              <option value="atLifeExpectancy">At Life Expectancy</option>
                              <option value="customDate">Custom Date</option>
                              <option value="customAge">Custom Age</option>
                            </Select>
                          </Field>
                          {endType === 'customDate' && (
                            <>
                              <Field>
                                <Label className="sr-only">Month</Label>
                                <Controller
                                  name="timeframe.end.month"
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
                                  name="timeframe.end.year"
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
                            <Field>
                              <Label className="sr-only">Age</Label>
                              <Controller
                                name="timeframe.end.age"
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
                      )}
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
              {frequency !== 'oneTime' && (
                <Disclosure as="div" className="border-border/50 border-t pt-4">
                  {({ open, close }) => (
                    <>
                      <DisclosureButton
                        ref={rateOfChangeButtonRef}
                        onClick={() => {
                          if (!open) close();
                          toggleDisclosure({ open, close, key: 'rateOfChange' });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            if (!open) close();
                            toggleDisclosure({ open, close, key: 'rateOfChange' });
                          }
                        }}
                        className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUpIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                          <span className="text-base/7 font-semibold">Rate of Change</span>
                          <span className="hidden sm:inline">|</span>
                          <span className="text-muted-foreground hidden truncate sm:inline">
                            {growthForDisplay(growthRate, growthLimit)}
                          </span>
                        </div>
                        <span className="text-muted-foreground ml-6 flex h-7 items-center">
                          <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                          <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                        </span>
                      </DisclosureButton>
                      <DisclosurePanel className="pt-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field>
                            <Label htmlFor="growthRate">Real Annual Growth</Label>
                            <NumberInput
                              name="growth.growthRate"
                              control={control}
                              id="growthRate"
                              inputMode="decimal"
                              placeholder="0%"
                              suffix="%"
                            />
                            {errors.growth?.growthRate && <ErrorMessage>{errors.growth?.growthRate?.message}</ErrorMessage>}
                          </Field>
                          <Field>
                            <Label htmlFor="growthLimit" className="flex w-full items-center justify-between">
                              <span className="whitespace-nowrap">Limit</span>
                              <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                            </Label>
                            <NumberInput
                              name="growth.growthLimit"
                              control={control}
                              id="growthLimit"
                              inputMode="decimal"
                              placeholder="$60,000"
                              prefix="$"
                            />
                            {errors.growth?.growthLimit && <ErrorMessage>{errors.growth?.growthLimit?.message}</ErrorMessage>}
                          </Field>
                        </div>
                      </DisclosurePanel>
                    </>
                  )}
                </Disclosure>
              )}
              <Disclosure as="div" className="border-border/50 border-t pt-4">
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
                          {expenseTaxTreatmentForDisplay(taxDeductible)}
                        </span>
                      </div>
                      <span className="text-muted-foreground ml-6 flex h-7 items-center">
                        <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                        <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                      </span>
                    </DisclosureButton>
                    <DisclosurePanel className="pt-4">
                      <CheckboxField>
                        <Controller
                          name="taxes.taxDeductible"
                          defaultValue={false}
                          control={control}
                          render={({ field: { onChange, value, name } }) => (
                            <Checkbox name={name} checked={value} onChange={(checked) => onChange(checked)} />
                          )}
                        />
                        <Label>Tax-Deductible</Label>
                        <Description>Make this expense tax-deductible, meaning it will reduce your taxable income.</Description>
                      </CheckboxField>
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
            </FieldGroup>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={onClose} className="hidden sm:inline-flex">
            Cancel
          </Button>
          <Button color="rose" type="submit">
            Save
          </Button>
        </DialogActions>
      </form>
    </>
  );
}
