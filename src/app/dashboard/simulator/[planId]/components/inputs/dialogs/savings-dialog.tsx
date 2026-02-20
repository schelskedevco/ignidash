'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo, useState } from 'react';
import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import posthog from 'posthog-js';

import { accountToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { accountFormSchema, type AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import { assetTypeForDisplay, type AssetInputs } from '@/lib/schemas/finances/asset-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { useAlreadySyncedIds } from '@/hooks/use-already-synced-ids';
import { useLinkableFinances } from '@/hooks/use-linkable-finances';
import { getErrorMessages } from '@/lib/utils/form-utils';
import { getCurrencySymbol, formatCurrencyPlaceholder } from '@/lib/utils/format-currency';

import SyncWithNetWorthTrackerSelect from './sync-with-nw-tracker-select';

const LINKABLE_SAVINGS_TYPES: AssetInputs['type'][] = ['savings', 'checking'];

interface SavingsDialogProps {
  onClose: () => void;
  selectedAccount: AccountInputs | null;
  accounts: Record<string, AccountInputs>;
  nwAssets: AssetInputs[] | null;
}

export default function SavingsDialog({ onClose, selectedAccount: _selectedAccount, accounts, nwAssets }: SavingsDialogProps) {
  const planId = useSelectedPlanId();
  const [selectedAccount] = useState(_selectedAccount);
  const numAccounts = Object.keys(accounts).length;

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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const syncedFinanceId = useWatch({ control, name: 'syncedFinanceId' });
  const isSynced = !!syncedFinanceId;

  const alreadySyncedIds = useAlreadySyncedIds(accounts, 'syncedFinanceId', selectedAccount?.id);
  const linkableAssets = useLinkableFinances(nwAssets, alreadySyncedIds, LINKABLE_SAVINGS_TYPES);

  const handleSyncChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assetId = e.target.value;
    if (!assetId) {
      setValue('syncedFinanceId', undefined);
      return;
    }

    const asset = linkableAssets.find((a) => a.id === assetId);
    if (!asset) return;

    setValue('syncedFinanceId', asset.id);
    setValue('balance', asset.value);
    setValue('name', asset.name);
  };

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
                  readOnly={isSynced}
                />
                {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
              </Field>
              <SyncWithNetWorthTrackerSelect
                fieldId="syncedFinanceId"
                options={linkableAssets.map((a) => ({ id: a.id, label: `${a.name} | ${assetTypeForDisplay(a.type)}` }))}
                value={syncedFinanceId}
                onChange={handleSyncChange}
              />
              <Field>
                <Label htmlFor="balance">Balance</Label>
                <NumberInput
                  name="balance"
                  control={control}
                  id="balance"
                  inputMode="decimal"
                  placeholder={formatCurrencyPlaceholder(15000)}
                  prefix={getCurrencySymbol()}
                  autoFocus={!isSynced}
                  readOnly={isSynced}
                />
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
