'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { /* CoinsIcon, */ CalendarIcon, BanknoteArrowUpIcon } from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller } from 'react-hook-form';
// import { useCurrentAge, useLifeExpectancy } from '@/lib/stores/quick-plan-store';
import { incomeFormSchema, type IncomeInputs } from '@/lib/schemas/income-form-schema';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Field, Fieldset, Label, ErrorMessage /* Description */ } from '@/components/catalyst/fieldset';
import { Combobox, ComboboxLabel, ComboboxOption } from '@/components/catalyst/combobox';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface IncomeDialogProps {
  incomeDialogOpen: boolean;
  setIncomeDialogOpen: (open: boolean) => void;
}

export default function IncomeDialog({ incomeDialogOpen, setIncomeDialogOpen }: IncomeDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      frequency: 'yearly',
      timeframe: {
        start: { type: 'now' },
        end: { type: 'at-retirement' },
      },
      growth: {
        growthRate: 3,
      },
    },
  });

  const onSubmit = (data: IncomeInputs) => {
    console.log('Form submitted:', data);
  };

  const frequency = useWatch({ control, name: 'frequency' });
  const startType = useWatch({ control, name: 'timeframe.start.type' });
  const endType = useWatch({ control, name: 'timeframe.end.type' });

  const getStartColSpan = () => {
    console.log(startType);
    if (startType === 'custom-date') return 'col-span-1';
    if (startType === 'custom-age') return 'col-span-2';
    return 'col-span-3';
  };

  const getEndColSpan = () => {
    console.log(endType);
    if (endType === 'custom-date') return 'col-span-1';
    if (endType === 'custom-age') return 'col-span-2';
    return 'col-span-3';
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

  // const currentAge = useCurrentAge()!;
  // const lifeExpectancy = useLifeExpectancy()!;
  // const ages = Array.from({ length: lifeExpectancy - currentAge + 1 }, (_, i) => currentAge + i);

  return (
    <>
      <DialogTitle>
        <div className="flex items-center gap-4">
          <BanknoteArrowUpIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>New Income</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Income details">
          <DialogBody data-slot="control" className="space-y-4">
            <div className="mb-8 grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input
                  {...register('name')}
                  id="name"
                  name="name"
                  placeholder="My Salary"
                  autoComplete="off"
                  inputMode="text"
                  invalid={!!errors.name}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="amount">Amount</Label>
                <NumberInputV2 name="amount" control={control} id="amount" inputMode="decimal" placeholder="$85,000" prefix="$" />
                {errors.amount && <ErrorMessage>{errors.amount?.message}</ErrorMessage>}
              </Field>
              <Field className="col-span-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select {...register('frequency')} id="frequency" name="frequency">
                  <optgroup label="Single Payment">
                    <option value="one-time">One-time</option>
                  </optgroup>
                  <optgroup label="Income Schedule">
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="weekly">Weekly</option>
                  </optgroup>
                </Select>
              </Field>
            </div>
            <Disclosure as="div" className="border-border/50 border-y py-4">
              <DisclosureButton className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left data-open:border-b data-open:pb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                  <span className="text-base/7 font-semibold">Timeframe</span>
                </div>
                <span className="text-muted-foreground ml-6 flex h-7 items-center">
                  <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                  <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                </span>
              </DisclosureButton>
              <DisclosurePanel className="py-4">
                <div className="grid grid-cols-3 gap-4">
                  <Field className={getStartColSpan()}>
                    <Label htmlFor="start">Start</Label>
                    <Select {...register('timeframe.start.type')} id="start" name="timeframe.start.type">
                      <option value="now">Now</option>
                      <option value="at-retirement">At Retirement</option>
                      <option value="custom-date">Custom Date</option>
                      <option value="custom-age">Custom Age</option>
                    </Select>
                  </Field>
                  {startType === 'custom-date' && (
                    <>
                      <Field>
                        <Label>Month</Label>
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
                        <Label>Year</Label>
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
                  {frequency !== 'one-time' && (
                    <>
                      <Field className={getEndColSpan()}>
                        <Label htmlFor="end">End</Label>
                        <Select {...register('timeframe.end.type')} id="end" name="timeframe.end.type">
                          <option value="at-retirement">At Retirement</option>
                          <option value="at-life-expectancy">At Life Expectancy</option>
                          <option value="custom-date">Custom Date</option>
                          <option value="custom-age">Custom Age</option>
                        </Select>
                      </Field>
                      {endType === 'custom-date' && (
                        <>
                          <Field>
                            <Label>Month</Label>
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
                            <Label>Year</Label>
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
                    </>
                  )}
                </div>
              </DisclosurePanel>
            </Disclosure>
            <Disclosure as="div">
              <DisclosureButton className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left data-open:border-b data-open:pb-4">
                <div className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                  <span className="text-base/7 font-semibold">Rate of Change</span>
                </div>
                <span className="text-muted-foreground ml-6 flex h-7 items-center">
                  <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                  <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                </span>
              </DisclosureButton>
              <DisclosurePanel className="py-4">
                <div className="grid grid-cols-5 gap-4">
                  <Field className="col-span-3">
                    <Label htmlFor="growth-rate" className="flex w-full items-center justify-between">
                      <span>Growth Rate</span>
                      <span className="text-muted-foreground text-sm/6">{Number(3).toFixed(1)}% real</span>
                    </Label>
                    <NumberInputV2
                      name="growth.growthRate"
                      control={control}
                      id="growth-rate"
                      inputMode="decimal"
                      placeholder="3%"
                      suffix="%"
                    />
                    {errors.growth?.growthRate && <ErrorMessage>{errors.growth?.growthRate?.message}</ErrorMessage>}
                  </Field>
                  <Field className="col-span-2">
                    <Label htmlFor="growth-limit">Limit</Label>
                    <NumberInputV2
                      name="growth.growthLimit"
                      control={control}
                      id="growth-limit"
                      inputMode="decimal"
                      placeholder="$120,000"
                      prefix="$"
                    />
                    {errors.growth?.growthLimit && <ErrorMessage>{errors.growth?.growthLimit?.message}</ErrorMessage>}
                  </Field>
                </div>
              </DisclosurePanel>
            </Disclosure>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={() => setIncomeDialogOpen(false)}>
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
