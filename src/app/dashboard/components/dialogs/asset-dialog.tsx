'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo, useState } from 'react';
import { WalletIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import posthog from 'posthog-js';

import { assetToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { assetFormSchema, type AssetInputs } from '@/lib/schemas/finances/asset-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { getErrorMessages } from '@/lib/utils/form-utils';

interface AssetDialogProps {
  onClose: () => void;
  selectedAsset: AssetInputs | null;
  numAssets: number;
}

export default function AssetDialog({ onClose, selectedAsset: _selectedAsset, numAssets }: AssetDialogProps) {
  const [selectedAsset] = useState(_selectedAsset);

  const newAssetDefaultValues = useMemo(
    () =>
      ({
        name: 'Asset ' + (numAssets + 1),
        id: '',
        updatedAt: -1,
        url: '',
        type: 'savings' as AssetInputs['type'],
      }) as const satisfies Partial<AssetInputs>,
    [numAssets]
  );

  const defaultValues = selectedAsset || newAssetDefaultValues;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(assetFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.finances.upsertAsset);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: AssetInputs) => {
    const assetId = data.id === '' ? uuidv4() : data.id;
    try {
      setSaveError(null);
      posthog.capture('save_asset', { save_mode: selectedAsset ? 'edit' : 'create' });
      await m({ asset: assetToConvex({ ...data, id: assetId }) });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save asset.');
      console.error('Error saving asset: ', error);
    }
  };

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <WalletIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedAsset ? 'Edit Asset' : 'New Asset'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Asset details">
          <DialogBody>
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input
                  {...register('name')}
                  id="name"
                  name="name"
                  placeholder="My Asset"
                  autoComplete="off"
                  inputMode="text"
                  invalid={!!errors.name}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="value">Value</Label>
                <NumberInput name="value" control={control} id="value" inputMode="decimal" placeholder="$15,000" prefix="$" autoFocus />
                {errors.value && <ErrorMessage>{errors.value?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="type">Asset Type</Label>
                <Select {...register('type')} id="type" name="type">
                  <optgroup label="Bank Accounts">
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                  </optgroup>
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
                  <optgroup label="Physical Assets">
                    <option value="realEstate">Real Estate</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="preciousMetals">Precious Metals</option>
                  </optgroup>
                  <optgroup label="Miscellaneous">
                    <option value="other">Other</option>
                  </optgroup>
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
