'use client';

import { useEffect, useMemo } from 'react';
import { TrendingUpIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';

import { useUpdateAccounts, useInvestmentData, useAccountsData } from '@/lib/stores/simulator-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import {
  accountFormSchema,
  type AccountInputs,
  isRothAccount,
  type RothAccountType,
  type InvestmentAccountType,
} from '@/lib/schemas/account-form-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface AccountDialogProps {
  onClose: () => void;
  selectedAccountID: string | null;
}

export default function AccountDialog({ onClose, selectedAccountID }: AccountDialogProps) {
  const existingAccountData = useInvestmentData(selectedAccountID);

  const numAccounts = Object.entries(useAccountsData()).length;
  const newAccountDefaultValues = useMemo(
    () =>
      ({
        name: 'Investment ' + (numAccounts + 1),
        id: '',
        type: '401k' as AccountInputs['type'],
        percentBonds: 0,
      }) as const satisfies Partial<AccountInputs>,
    [numAccounts]
  );

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
    const processedData = { ...data };

    if (isRothAccount(data.type)) {
      const rothData = processedData as Extract<AccountInputs, { type: RothAccountType }>;
      rothData.contributionBasis ??= data.balance;
    }

    if (data.type === 'taxableBrokerage') {
      const taxableData = processedData as Extract<AccountInputs, { type: 'taxableBrokerage' }>;
      taxableData.costBasis ??= data.balance;
    }

    const accountId = processedData.id === '' ? uuidv4() : processedData.id;
    updateAccounts({ ...processedData, id: accountId });
    onClose();
  };

  const type = useWatch({ control, name: 'type' });

  useEffect(() => {
    if (!isRothAccount(type)) {
      unregister('contributionBasis');
    }

    if (type !== 'taxableBrokerage') {
      unregister('costBasis');
    }
  }, [type, unregister]);

  const getBalanceColSpan = () => {
    if (type === 'taxableBrokerage' || type === 'roth401k' || type === 'rothIra') return 'col-span-1';
    return 'col-span-2';
  };

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <TrendingUpIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedAccountID ? 'Edit Investment' : 'New Investment'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Account details">
          <DialogBody>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
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
                  />
                  {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
                </Field>
                <Field className="col-span-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select {...register('type')} id="type" name="type">
                    <option value="taxableBrokerage">Taxable Brokerage</option>
                    <option value="401k">401(k)</option>
                    <option value="ira">IRA</option>
                    <option value="roth401k">Roth 401(k)</option>
                    <option value="rothIra">Roth IRA</option>
                    <option value="hsa">HSA</option>
                  </Select>
                </Field>
                <Field className={getBalanceColSpan()}>
                  <Label htmlFor="balance">Balance</Label>
                  <NumberInput
                    name="balance"
                    control={control}
                    id="balance"
                    inputMode="decimal"
                    placeholder="$15,000"
                    prefix="$"
                    autoFocus
                  />
                  {errors.balance && <ErrorMessage>{errors.balance?.message}</ErrorMessage>}
                </Field>
                {type === 'taxableBrokerage' && (
                  <Field>
                    <Label htmlFor="costBasis" className="flex w-full items-center justify-between">
                      <span className="whitespace-nowrap">Cost Basis</span>
                      <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                    </Label>
                    <NumberInput name="costBasis" control={control} id="costBasis" inputMode="decimal" placeholder="–" prefix="$" />
                    {(errors as FieldErrors<Extract<AccountInputs, { type: 'taxableBrokerage' }>>).costBasis?.message && (
                      <ErrorMessage>
                        {(errors as FieldErrors<Extract<AccountInputs, { type: 'taxableBrokerage' }>>).costBasis?.message}
                      </ErrorMessage>
                    )}
                  </Field>
                )}
                {isRothAccount(type) && (
                  <Field>
                    <Label htmlFor="contributionBasis" className="flex w-full items-center justify-between">
                      <span className="whitespace-nowrap">Contribution Basis</span>
                      <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                    </Label>
                    <NumberInput
                      name="contributionBasis"
                      control={control}
                      id="contributionBasis"
                      inputMode="decimal"
                      placeholder="–"
                      prefix="$"
                    />
                    {(errors as FieldErrors<Extract<AccountInputs, { type: RothAccountType }>>).contributionBasis?.message && (
                      <ErrorMessage>
                        {(errors as FieldErrors<Extract<AccountInputs, { type: RothAccountType }>>).contributionBasis?.message}
                      </ErrorMessage>
                    )}
                  </Field>
                )}
                <Field className="col-span-2">
                  <Label htmlFor="percentBonds">% Bonds</Label>
                  <NumberInput
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
                  {(errors as FieldErrors<Extract<AccountInputs, { type: InvestmentAccountType }>>).percentBonds?.message && (
                    <ErrorMessage>
                      {(errors as FieldErrors<Extract<AccountInputs, { type: InvestmentAccountType }>>).percentBonds?.message}
                    </ErrorMessage>
                  )}
                </Field>
              </div>
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
