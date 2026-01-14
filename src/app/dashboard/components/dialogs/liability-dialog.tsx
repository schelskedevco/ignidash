'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo, useState } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import posthog from 'posthog-js';

import { liabilityToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { liabilityFormSchema, type LiabilityInputs } from '@/lib/schemas/finances/liability-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { getErrorMessages } from '@/lib/utils/form-utils';

interface LiabilityDialogProps {
  onClose: () => void;
  selectedLiability: LiabilityInputs | null;
  numLiabilities: number;
}

export default function LiabilityDialog({ onClose, selectedLiability: _selectedLiability, numLiabilities }: LiabilityDialogProps) {
  const [selectedLiability] = useState(_selectedLiability);

  const newLiabilityDefaultValues = useMemo(
    () =>
      ({
        name: 'Liability ' + (numLiabilities + 1),
        id: '',
        updatedAt: -1,
        url: '',
        type: 'creditCard' as LiabilityInputs['type'],
      }) as const satisfies Partial<LiabilityInputs>,
    [numLiabilities]
  );

  const defaultValues = selectedLiability || newLiabilityDefaultValues;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(liabilityFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.finances.upsertLiability);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: LiabilityInputs) => {
    const liabilityId = data.id === '' ? uuidv4() : data.id;
    try {
      setSaveError(null);
      posthog.capture('save_liability', { save_mode: selectedLiability ? 'edit' : 'create' });
      await m({ liability: liabilityToConvex({ ...data, id: liabilityId }) });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save liability.');
      console.error('Error saving liability: ', error);
    }
  };

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <CreditCardIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedLiability ? 'Edit Liability' : 'New Liability'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Liability details">
          <DialogBody>
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input
                  {...register('name')}
                  id="name"
                  name="name"
                  placeholder="My Liability"
                  autoComplete="off"
                  inputMode="text"
                  invalid={!!errors.name}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="balance">Balance</Label>
                <NumberInput name="balance" control={control} id="balance" inputMode="decimal" placeholder="$20,000" prefix="$" autoFocus />
                {errors.balance && <ErrorMessage>{errors.balance?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="type">Liability Type</Label>
                <Select {...register('type')} id="type" name="type">
                  <option value="mortgage">Mortgage</option>
                  <option value="autoLoan">Auto Loan</option>
                  <option value="studentLoan">Student Loan</option>
                  <option value="personalLoan">Personal Loan</option>
                  <option value="creditCard">Credit Card</option>
                  <option value="medicalDebt">Medical Debt</option>
                  <option value="other">Other</option>
                </Select>
                {errors.type && <ErrorMessage>{errors.type?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="url" className="flex w-full items-center justify-between">
                  <span className="whitespace-nowrap">URL</span>
                  <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                </Label>
                <Input
                  {...register('url')}
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://www.example.com"
                  autoComplete="off"
                  inputMode="url"
                  invalid={!!errors.url}
                  aria-invalid={!!errors.url}
                />
                {errors.url && <ErrorMessage>{errors.url?.message}</ErrorMessage>}
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
