'use client';

import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useUpdateContributionRules, useContributionRuleData } from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { contributionFormSchema, type ContributionInputs } from '@/lib/schemas/contribution-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';

interface ContributionRuleDialogProps {
  setContributionRuleDialogOpen: (open: boolean) => void;
  selectedContributionRuleID: string | null;
}

export default function ContributionRuleDialog({ setContributionRuleDialogOpen, selectedContributionRuleID }: ContributionRuleDialogProps) {
  const existingContributionRuleData = useContributionRuleData(selectedContributionRuleID);
  const defaultValues = (existingContributionRuleData || undefined) as never;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contributionFormSchema),
    defaultValues,
  });

  const updateContributionRules = useUpdateContributionRules();
  const onSubmit = (data: ContributionInputs) => {
    const contributionRuleID = selectedContributionRuleID ?? uuidv4();
    updateContributionRules(contributionRuleID, data);
    setContributionRuleDialogOpen(false);
  };

  return (
    <>
      <DialogTitle>
        <div className="flex items-center gap-4">
          <PiggyBankIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>New Contribution Rule</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Contribution Rule details">
          <DialogBody>
            <FieldGroup>
              <Field>
                <Label htmlFor="targetBalance">Target Balance</Label>
                <NumberInputV2
                  name="targetBalance"
                  control={control}
                  id="targetBalance"
                  inputMode="decimal"
                  placeholder="$15,000"
                  prefix="$"
                  autoFocus={selectedContributionRuleID !== null}
                />
                {errors.targetBalance && <ErrorMessage>{errors.targetBalance?.message}</ErrorMessage>}
              </Field>
            </FieldGroup>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={() => setContributionRuleDialogOpen(false)}>
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
