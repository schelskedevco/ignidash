'use client';

import { useMemo } from 'react';
import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useUpdateAccounts, useSavingsData, useAccountsData } from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { accountFormSchema, type AccountInputs } from '@/lib/schemas/account-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface SavingsDialogProps {
  onClose: () => void;
  selectedAccountID: string | null;
}

export default function SavingsDialog({ onClose, selectedAccountID }: SavingsDialogProps) {
  const existingAccountData = useSavingsData(selectedAccountID);

  const numAccounts = Object.entries(useAccountsData()).length;
  const newAccountDefaultValues = useMemo(
    () =>
      ({
        name: 'Savings ' + (numAccounts + 1),
        id: '',
        type: 'savings' as AccountInputs['type'],
      }) as const satisfies Partial<AccountInputs>,
    [numAccounts]
  );

  const defaultValues = (existingAccountData || newAccountDefaultValues) as never;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  const updateAccounts = useUpdateAccounts();
  const onSubmit = (data: AccountInputs) => {
    const accountId = data.id === '' ? uuidv4() : data.id;
    updateAccounts({ ...data, id: accountId });
    onClose();
  };

  return (
    <>
      <DialogTitle>
        <div className="flex items-center gap-4">
          <PiggyBankIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedAccountID ? 'Edit Savings' : 'New Savings'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Account details">
          <DialogBody>
            <FieldGroup>
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input
                  {...register('name')}
                  id="name"
                  name="name"
                  placeholder="My Savings"
                  autoComplete="off"
                  inputMode="text"
                  invalid={!!errors.name}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="currentValue">Balance</Label>
                <NumberInputV2
                  name="currentValue"
                  control={control}
                  id="currentValue"
                  inputMode="decimal"
                  placeholder="$15,000"
                  prefix="$"
                  autoFocus
                />
                {errors.currentValue && <ErrorMessage>{errors.currentValue?.message}</ErrorMessage>}
              </Field>
            </FieldGroup>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={onClose}>
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
