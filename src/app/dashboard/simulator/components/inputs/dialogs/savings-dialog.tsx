'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo, useEffect } from 'react';
import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useSavingsData, useAccountsData } from '@/hooks/use-convex-data';
import { accountToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { accountFormSchema, type AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { useSelectedPlanId } from '@/lib/stores/simulator-store';

interface SavingsDialogProps {
  onClose: () => void;
  selectedAccountID: string | null;
}

export default function SavingsDialog({ onClose, selectedAccountID }: SavingsDialogProps) {
  const planId = useSelectedPlanId();
  const existingAccountData = useSavingsData(selectedAccountID);

  const accounts = useAccountsData();
  const numAccounts = Object.entries(accounts).length;
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
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (existingAccountData) reset(existingAccountData);
  }, [existingAccountData, reset]);

  const m = useMutation(api.account.upsertAccount);
  const onSubmit = async (data: AccountInputs) => {
    const accountId = data.id === '' ? uuidv4() : data.id;
    await m({ account: accountToConvex({ ...data, id: accountId }), planId });
    onClose();
  };

  return (
    <>
      <DialogTitle onClose={onClose}>
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
                <Label htmlFor="balance">Balance</Label>
                <NumberInput name="balance" control={control} id="balance" inputMode="decimal" placeholder="$15,000" prefix="$" autoFocus />
                {errors.balance && <ErrorMessage>{errors.balance?.message}</ErrorMessage>}
              </Field>
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
