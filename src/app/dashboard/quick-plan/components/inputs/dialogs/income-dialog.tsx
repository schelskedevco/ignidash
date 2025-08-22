'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { /* CoinsIcon, */ CalendarIcon, BanknoteArrowUpIcon } from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { incomeFormSchema, type IncomeInputs } from '@/lib/schemas/income-form-schema';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Field, Fieldset, Label, ErrorMessage /* Description */ } from '@/components/catalyst/fieldset';
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
    mode: 'onBlur',
  });

  const onSubmit = (data: IncomeInputs) => {
    console.log('Form submitted:', data);
  };

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
              <div className="col-span-2">
                <Field>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select {...register('frequency')} id="frequency" name="frequency" defaultValue="yearly">
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
            </div>
            <Disclosure as="div" className="border-border/50 border-y py-4">
              <DisclosureButton className="group data-open:border-border/25 flex w-full items-start justify-between text-left data-open:border-b data-open:pb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                  <span className="text-base/7 font-semibold">Timeframe</span>
                </div>
                <span className="text-muted-foreground ml-6 flex h-7 items-center">
                  <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                  <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                </span>
              </DisclosureButton>
              <DisclosurePanel className="py-4">...</DisclosurePanel>
            </Disclosure>
            <Disclosure as="div">
              <DisclosureButton className="group data-open:border-border/25 flex w-full items-start justify-between text-left data-open:border-b data-open:pb-4">
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
                  <div className="col-span-3">
                    <Field>
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
                  </div>
                  <div className="col-span-2">
                    <Field>
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
