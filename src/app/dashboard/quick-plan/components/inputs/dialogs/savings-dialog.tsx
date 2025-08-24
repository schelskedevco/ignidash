'use client';

import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useUpdateAccounts } from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { accountFormSchema, type AccountInputs } from '@/lib/schemas/account-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface SavingsDialogProps {
  setSavingsDialogOpen: (open: boolean) => void;
  selectedAccountID: string | null;
}

export default function SavingsDialog({ setSavingsDialogOpen, selectedAccountID }: SavingsDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      type: 'savings',
    },
  });

  const updateAccounts = useUpdateAccounts();
  const onSubmit = (data: AccountInputs) => {
    const accountID = selectedAccountID ?? uuidv4();
    updateAccounts(accountID, data);
    setSavingsDialogOpen(false);
  };

  return (
    <>
      <DialogTitle>
        <div className="flex items-center gap-4">
          <PiggyBankIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>New Savings</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Account details">
          <DialogBody data-slot="control" className="space-y-4">
            <Field className="col-span-2">
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
                autoFocus={selectedAccountID === null}
              />
              {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
            </Field>
            <Field>
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
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={() => setSavingsDialogOpen(false)}>
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
