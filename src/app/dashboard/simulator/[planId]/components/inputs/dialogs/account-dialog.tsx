'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useMemo, useState } from 'react';
import { TrendingUpIcon, InfoIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import posthog from 'posthog-js';

import { accountToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { accountFormSchema, type AccountInputs, isRothAccount, type RothAccountType } from '@/lib/schemas/inputs/account-form-schema';
import { assetTypeForDisplay, type AssetInputs } from '@/lib/schemas/finances/asset-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { useAlreadySyncedIds } from '@/hooks/use-already-synced-ids';
import { useLinkableFinances } from '@/hooks/use-linkable-finances';
import { getErrorMessages } from '@/lib/utils/form-utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getCurrencySymbol, formatCurrencyPlaceholder } from '@/lib/utils/format-currency';

import SyncWithNetWorthTrackerSelect from './sync-with-nw-tracker-select';

const LINKABLE_INVESTMENT_TYPES: AssetInputs['type'][] = [
  'taxableBrokerage',
  '401k',
  '403b',
  'ira',
  'roth401k',
  'roth403b',
  'rothIra',
  'hsa',
];

interface AccountDialogProps {
  onClose: () => void;
  selectedAccount: AccountInputs | null;
  accounts: Record<string, AccountInputs>;
  nwAssets: AssetInputs[] | null;
}

export default function AccountDialog({ onClose, selectedAccount: _selectedAccount, accounts, nwAssets }: AccountDialogProps) {
  const planId = useSelectedPlanId();
  const [selectedAccount] = useState(_selectedAccount);
  const numAccounts = Object.keys(accounts).length;

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

  const defaultValues = (selectedAccount || newAccountDefaultValues) as never;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    getFieldState,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.account.upsertAccount);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: AccountInputs) => {
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
    try {
      setSaveError(null);
      posthog.capture('save_account', { plan_id: planId, save_mode: selectedAccount ? 'edit' : 'create' });
      await m({ account: accountToConvex({ ...processedData, id: accountId }), planId });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save account.');
      console.error('Error saving account: ', error);
    }
  };

  const type = useWatch({ control, name: 'type' });
  const syncedFinanceId = useWatch({ control, name: 'syncedFinanceId' });
  const isSynced = !!syncedFinanceId;

  const alreadySyncedIds = useAlreadySyncedIds(accounts, 'syncedFinanceId', selectedAccount?.id);
  const linkableAssets = useLinkableFinances(nwAssets, alreadySyncedIds, LINKABLE_INVESTMENT_TYPES);

  const handleSyncChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assetId = e.target.value;
    if (!assetId) {
      setValue('syncedFinanceId', undefined);
      return;
    }

    const asset = linkableAssets.find((a) => a.id === assetId);
    if (!asset) return;

    setValue('syncedFinanceId', asset.id);
    setValue('type', asset.type as AccountInputs['type']);
    setValue('balance', asset.value);
    setValue('name', asset.name);
  };

  useEffect(() => {
    if (!isRothAccount(type)) {
      unregister('contributionBasis');
    }

    if (type !== 'taxableBrokerage') {
      unregister('costBasis');
    }
  }, [type, unregister]);

  const getBalanceColSpan = () => {
    if (type === 'taxableBrokerage' || isRothAccount(type)) return 'col-span-1';
    return 'col-span-2';
  };

  const getNameColSpan = () => {
    if (linkableAssets.length === 0) return 'col-span-2';
    return 'col-span-1';
  };

  const { error: costBasisError } = getFieldState('costBasis');
  const { error: contributionBasisError } = getFieldState('contributionBasis');
  const { error: percentBondsError } = getFieldState('percentBonds');

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <TrendingUpIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedAccount ? 'Edit Investment' : 'New Investment'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Account details">
          <DialogBody>
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
              <div className="grid grid-cols-2 gap-4">
                <Field className={getNameColSpan()}>
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
                <Field className="col-span-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select {...register('type')} id="type" name="type" disabled={isSynced}>
                    <optgroup label="Taxable Accounts">
                      <option value="taxableBrokerage">Taxable Brokerage</option>
                    </optgroup>
                    <optgroup label="Tax-Deferred Accounts">
                      <option value="401k">401(k)</option>
                      <option value="403b">403(b)</option>
                      <option value="ira">IRA</option>
                      <option value="hsa">HSA</option>
                    </optgroup>
                    <optgroup label="Tax-Free Accounts">
                      <option value="roth401k">Roth 401(k)</option>
                      <option value="roth403b">Roth 403(b)</option>
                      <option value="rothIra">Roth IRA</option>
                    </optgroup>
                  </Select>
                  {errors.type && <ErrorMessage>{errors.type?.message}</ErrorMessage>}
                </Field>
                <Field className={getBalanceColSpan()}>
                  <Label htmlFor="balance">Balance</Label>
                  <NumberInput
                    name="balance"
                    control={control}
                    id="balance"
                    inputMode="decimal"
                    placeholder={formatCurrencyPlaceholder(15000)}
                    prefix={getCurrencySymbol()}
                    autoFocus
                    readOnly={isSynced}
                  />
                  {errors.balance && <ErrorMessage>{errors.balance?.message}</ErrorMessage>}
                </Field>
                {type === 'taxableBrokerage' && (
                  <Field>
                    <Label htmlFor="costBasis" className="flex w-full items-center justify-between">
                      <span className="whitespace-nowrap">Cost Basis</span>
                      <Tooltip>
                        <TooltipTrigger className="text-muted-foreground">
                          <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>What you originally paid for your taxable investments.</p>
                          <p>Optional—helps calculate taxes owed when you sell.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <NumberInput
                      name="costBasis"
                      control={control}
                      id="costBasis"
                      inputMode="decimal"
                      placeholder="–"
                      prefix={getCurrencySymbol()}
                    />
                    {costBasisError && <ErrorMessage>{costBasisError.message}</ErrorMessage>}
                  </Field>
                )}
                {isRothAccount(type) && (
                  <Field>
                    <Label htmlFor="contributionBasis" className="flex w-full items-center justify-between">
                      <span className="whitespace-nowrap">Contribution Basis</span>
                      <Tooltip>
                        <TooltipTrigger className="text-muted-foreground">
                          <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The sum of your direct contributions (not earnings).</p>
                          <p>Optional—this portion can be withdrawn without penalty.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <NumberInput
                      name="contributionBasis"
                      control={control}
                      id="contributionBasis"
                      inputMode="decimal"
                      placeholder="–"
                      prefix={getCurrencySymbol()}
                    />
                    {contributionBasisError && <ErrorMessage>{contributionBasisError.message}</ErrorMessage>}
                  </Field>
                )}
                <Field className="col-span-2">
                  <Label htmlFor="percentBonds" className="flex w-full items-center justify-between">
                    <span className="whitespace-nowrap">% Bonds</span>
                    <Tooltip>
                      <TooltipTrigger className="text-muted-foreground">
                        <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The percentage of this account&apos;s holdings allocated to bonds.</p>
                        <p>Modeled as US Treasury bonds, which generate taxable interest income.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
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
                  {percentBondsError && <ErrorMessage>{percentBondsError.message}</ErrorMessage>}
                </Field>
              </div>
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
