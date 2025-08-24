'use client';

import { LandmarkIcon } from 'lucide-react';
// import { useState, useCallback, useEffect, useRef, MutableRefObject } from 'react';
// import { v4 as uuidv4 } from 'uuid';
// import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
// import { MinusIcon, PlusIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type FieldErrors /* Controller */ } from 'react-hook-form';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { accountFormSchema, type AccountInputs } from '@/lib/schemas/account-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
// import { Combobox, ComboboxLabel, ComboboxOption } from '@/components/catalyst/combobox';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface AccountDialogProps {
  setAccountDialogOpen: (open: boolean) => void;
  selectedAccountID: string | null;
}

export default function AccountDialog({ setAccountDialogOpen, selectedAccountID }: AccountDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountFormSchema),
  });

  const onSubmit = (data: AccountInputs) => {
    console.log(data);
  };

  const type = useWatch({ control, name: 'type' });

  const getBalanceColSpan = () => {
    if (type === 'taxable-brokerage' || type === 'roth-401k' || type === 'roth-ira') return 'col-span-1';
    return 'col-span-2';
  };

  return (
    <>
      <DialogTitle>
        <div className="flex items-center gap-4">
          <LandmarkIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>New Account</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Account details">
          <DialogBody data-slot="control" className="space-y-4">
            <div className="mb-8 grid grid-cols-2 gap-4">
              <Field className="col-span-2">
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
                  autoFocus={selectedAccountID === null}
                />
                {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
              </Field>
              <Field className="col-span-2">
                <Label htmlFor="type">Account Type</Label>
                <Select {...register('type')} id="type" name="type">
                  <option value="savings">Savings</option>
                  <option value="taxable-brokerage">Taxable Brokerage</option>
                  <option value="401k">401(k)</option>
                  <option value="ira">IRA</option>
                  <option value="roth-401k">Roth 401(k)</option>
                  <option value="roth-ira">Roth IRA</option>
                  <option value="hsa">HSA</option>
                </Select>
              </Field>
              <Field className={getBalanceColSpan()}>
                <Label htmlFor="balance">Balance</Label>
                <NumberInputV2
                  name="balance"
                  control={control}
                  id="balance"
                  inputMode="decimal"
                  placeholder="$15,000"
                  prefix="$"
                  autoFocus={selectedAccountID !== null}
                />
                {errors.balance && <ErrorMessage>{errors.balance?.message}</ErrorMessage>}
              </Field>
              {type === 'taxable-brokerage' &&
                (() => {
                  const error = (errors as FieldErrors<Extract<AccountInputs, { type: 'taxable-brokerage' }>>).costBasis?.message;
                  return (
                    <Field>
                      <Label htmlFor="costBasis">Cost Basis</Label>
                      <NumberInputV2
                        name="costBasis"
                        control={control}
                        id="costBasis"
                        inputMode="decimal"
                        placeholder="$15,000"
                        prefix="$"
                      />
                      {error && <ErrorMessage>{error}</ErrorMessage>}
                    </Field>
                  );
                })()}
              {(type === 'roth-401k' || type === 'roth-ira') &&
                (() => {
                  const error = (errors as FieldErrors<Extract<AccountInputs, { type: 'roth-401k' | 'roth-ira' }>>).contributions?.message;
                  return (
                    <Field>
                      <Label htmlFor="contributions">Contributions</Label>
                      <NumberInputV2
                        name="contributions"
                        control={control}
                        id="contributions"
                        inputMode="decimal"
                        placeholder="$5,000"
                        prefix="$"
                      />
                      {error && <ErrorMessage>{error}</ErrorMessage>}
                    </Field>
                  );
                })()}
            </div>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={() => {}}>
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
