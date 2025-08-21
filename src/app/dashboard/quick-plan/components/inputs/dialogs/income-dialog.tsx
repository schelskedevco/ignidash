'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label /* Description */ } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface IncomeDialogProps {
  incomeDialogOpen: boolean;
  setIncomeDialogOpen: (open: boolean) => void;
}

export default function IncomeDialog({ incomeDialogOpen, setIncomeDialogOpen }: IncomeDialogProps) {
  return (
    <>
      <DialogTitle>Income</DialogTitle>
      <DialogBody className="space-y-4">
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset aria-label="Income details">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="My Salary" autoComplete="off" inputMode="text" />
                </Field>
                <Field>
                  <Label htmlFor="amount">Amount</Label>
                  <NumberInput
                    id="amount"
                    value={85000}
                    onBlur={(value) => {
                      return { success: true };
                    }}
                    inputMode="decimal"
                    placeholder="$85,000"
                    prefix="$"
                  />
                </Field>
                <div className="col-span-2">
                  <Field>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select id="frequency" name="frequency">
                      <option value="yearly">Yearly</option>
                      <option value="one-time">One-time</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </Select>
                  </Field>
                </div>
              </div>
              <Divider />
              <Disclosure as="div" className="py-6 first:pt-0 last:pb-0">
                <DisclosureButton className="group flex w-full items-start justify-between text-left">
                  <span className="text-base/7 font-semibold">Rate of Change</span>
                  <span className="ml-6 flex h-7 items-center">
                    <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                    <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                  </span>
                </DisclosureButton>
                <DisclosurePanel className="mt-2 pr-12">
                  <p className="text-muted-foreground text-base/7">...</p>
                </DisclosurePanel>
              </Disclosure>
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3">
                  <Field>
                    <Label htmlFor="growth-rate" className="flex w-full items-center justify-between">
                      <span>Growth Rate</span>
                      <span className="text-muted-foreground text-sm/6">{Number(3).toFixed(1)}% real</span>
                    </Label>
                    <NumberInput
                      id="growth-rate"
                      value={3}
                      onBlur={(value) => {
                        return { success: true };
                      }}
                      inputMode="decimal"
                      placeholder="3%"
                      suffix="%"
                    />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field>
                    <Label htmlFor="growth-limit">Limit</Label>
                    <NumberInput
                      id="growth-limit"
                      value={null}
                      onBlur={(value) => {
                        return { success: true };
                      }}
                      inputMode="decimal"
                      placeholder="$120,000"
                      prefix="$"
                    />
                  </Field>
                </div>
              </div>
              <Divider />
            </FieldGroup>
          </Fieldset>
        </form>
      </DialogBody>
      <DialogActions>
        <Button plain onClick={() => setIncomeDialogOpen(false)}>
          Cancel
        </Button>
        <Button color="rose" onClick={() => setIncomeDialogOpen(false)}>
          Save
        </Button>
      </DialogActions>
    </>
  );
}
