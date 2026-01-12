'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo, useState } from 'react';
import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import posthog from 'posthog-js';

import { accountToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { accountFormSchema, type AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { getErrorMessages } from '@/lib/utils/form-utils';

interface SavingsDialogProps {
  onClose: () => void;
  selectedAccount: AccountInputs | null;
  numAccounts: number;
}

export default function SavingsDialog({ onClose, selectedAccount: _selectedAccount, numAccounts }: SavingsDialogProps) {
  const planId = useSelectedPlanId();
  const [selectedAccount] = useState(_selectedAccount);

  const newAccountDefaultValues = useMemo(
    () =>
      ({
        name: 'Savings ' + (numAccounts + 1),
        id: '',
        type: 'savings' as AccountInputs['type'],
      }) as const satisfies Partial<AccountInputs>,
    [numAccounts]
  );

  const defaultValues = (selectedAccount || newAccountDefaultValues) as never;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.account.upsertAccount);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: AccountInputs) => {
    const accountId = data.id === '' ? uuidv4() : data.id;
    try {
      setSaveError(null);
      posthog.capture('save_account', { plan_id: planId, save_mode: selectedAccount ? 'edit' : 'create' });
      await m({ account: accountToConvex({ ...data, id: accountId }), planId });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save account.');
      console.error('Error saving account: ', error);
    }
  };

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <PiggyBankIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedAccount ? 'Edit Savings' : 'New Savings'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Account details">
          <DialogBody>
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
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
