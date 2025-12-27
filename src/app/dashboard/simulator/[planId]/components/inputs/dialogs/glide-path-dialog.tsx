'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMemo, useState } from 'react';
import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { track } from '@vercel/analytics';

import { glidePathToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import { glidePathSchema, type GlidePathInputs } from '@/lib/schemas/inputs/glide-path-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Button } from '@/components/catalyst/button';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

interface GlidePathDialogProps {
  onClose: () => void;
  glidePath?: GlidePathInputs;
  accounts: AccountInputs[];
}

export default function GlidePathDialog({ onClose, glidePath: _glidePath, accounts }: GlidePathDialogProps) {
  const planId = useSelectedPlanId();
  const [glidePath] = useState(_glidePath);

  const glidePathDefaultValues = useMemo(
    () =>
      ({
        id: '',
        endTimePoint: { type: 'customAge' as const, age: 65 },
        targetStockAllocation: 50,
        targetBondAllocation: 30,
        targetCashAllocation: 20,
      }) as const satisfies Partial<GlidePathInputs>,
    []
  );

  const defaultValues = glidePath || glidePathDefaultValues;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(glidePathSchema),
    defaultValues,
  });

  const m = useMutation(api.glide_path.update);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: GlidePathInputs) => {
    const glidePathId = data.id === '' ? uuidv4() : data.id;
    try {
      setSaveError(null);
      track('Save glide path', { saveMode: glidePath ? 'edit' : 'create' });
      await m({ glidePath: glidePathToConvex({ ...data, id: glidePathId }), planId });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save glide path.');
      console.error('Error saving glide path: ', error);
    }
  };

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <PiggyBankIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{glidePath ? 'Edit Glide Path' : 'Set Glide Path'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Glide path details">
          <DialogBody>
            <FieldGroup>
              {saveError && <ErrorMessageCard errorMessage={saveError} />}
              <Field>
                <Label htmlFor="targetStockAllocation">Target Stock Allocation</Label>
                <NumberInput
                  name="targetStockAllocation"
                  control={control}
                  id="targetStockAllocation"
                  inputMode="decimal"
                  placeholder="50%"
                  suffix="%"
                  autoFocus
                />
                {errors.targetStockAllocation && <ErrorMessage>{errors.targetStockAllocation?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="targetBondAllocation">Target Bond Allocation</Label>
                <NumberInput
                  name="targetBondAllocation"
                  control={control}
                  id="targetBondAllocation"
                  inputMode="decimal"
                  placeholder="30%"
                  suffix="%"
                />
                {errors.targetBondAllocation && <ErrorMessage>{errors.targetBondAllocation?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="targetCashAllocation">Target Cash Allocation</Label>
                <NumberInput
                  name="targetCashAllocation"
                  control={control}
                  id="targetCashAllocation"
                  inputMode="decimal"
                  placeholder="20%"
                  suffix="%"
                />
                {errors.targetCashAllocation && <ErrorMessage>{errors.targetCashAllocation?.message}</ErrorMessage>}
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
