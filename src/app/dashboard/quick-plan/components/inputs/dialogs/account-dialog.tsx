'use client';

import { useEffect } from 'react';
import { TrendingUpIcon, HandshakeIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';

import { useUpdateAccounts, useInvestmentData } from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { accountFormSchema, type AccountInputs, isRothAccount, type RothAccountType } from '@/lib/schemas/account-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

const newAccountDefaultValues = {
  type: 'taxable-brokerage' as AccountInputs['type'],
};

interface AccountDialogProps {
  setAccountDialogOpen: (open: boolean) => void;
  selectedAccountID: string | null;
}

export default function AccountDialog({ setAccountDialogOpen, selectedAccountID }: AccountDialogProps) {
  const existingAccountData = useInvestmentData(selectedAccountID);
  const defaultValues = (existingAccountData || newAccountDefaultValues) as never;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  const updateAccounts = useUpdateAccounts();
  const onSubmit = (data: AccountInputs) => {
    const accountID = selectedAccountID ?? uuidv4();
    updateAccounts(accountID, data);
    setAccountDialogOpen(false);
  };

  const type = useWatch({ control, name: 'type' });

  useEffect(() => {
    if (!isRothAccount(type)) {
      unregister('contributions');
    }

    if (type !== 'taxable-brokerage') {
      unregister('costBasis');
    }
  }, [type, unregister]);

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const percentBonds = clamp(Number(useWatch({ control, name: 'percentBonds' }) || 0), 0, 100);

  const getBalanceColSpan = () => {
    if (type === 'taxable-brokerage' || type === 'roth-401k' || type === 'roth-ira') return 'col-span-1';
    return 'col-span-2';
  };

  return (
    <>
      <DialogTitle>
        <div className="flex items-center gap-4">
          <TrendingUpIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>New Investment</span>
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
                  placeholder="My Investment"
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
              {isRothAccount(type) &&
                (() => {
                  const error = (errors as FieldErrors<Extract<AccountInputs, { type: RothAccountType }>>).contributions?.message;
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
            <Disclosure as="div" className="border-border/50 border-y py-4">
              {({ open, close }) => (
                <>
                  <DisclosureButton className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4">
                    <div className="flex items-center gap-2">
                      <HandshakeIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                      <span className="text-base/7 font-semibold">Bonds</span>
                      <span className="hidden sm:inline">|</span>
                      <span className="text-muted-foreground hidden truncate sm:inline">
                        {percentBonds !== 0 ? `${percentBonds}% Bonds, ${100 - percentBonds}% Stocks` : 'All Stocks, No Bonds'}
                      </span>
                    </div>
                    <span className="text-muted-foreground ml-6 flex h-7 items-center">
                      <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                      <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                    </span>
                  </DisclosureButton>
                  <DisclosurePanel className="py-4">
                    <Field>
                      <Label htmlFor="percentBonds">Bond Allocation</Label>
                      <NumberInputV2
                        name="percentBonds"
                        control={control}
                        id="percentBonds"
                        inputMode="numeric"
                        placeholder="20%"
                        suffix="%"
                        decimalScale={0}
                        step={1}
                        min={0}
                        max={100}
                      />
                    </Field>
                    <div aria-hidden="true" className="mt-2">
                      <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                        <div style={{ width: `${percentBonds}%` }} className="bg-primary h-2 rounded-full" />
                      </div>
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={() => setAccountDialogOpen(false)}>
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
