'use client';

import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import { useUpdateContributionRules, useContributionRuleData, useAccountsData } from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { contributionFormSchema, type ContributionInputs } from '@/lib/schemas/contribution-form-schema';
import { accountTypeForDisplay } from '@/lib/schemas/account-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { Combobox, ComboboxLabel, ComboboxDescription, ComboboxOption } from '@/components/catalyst/combobox';
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

  const accounts = useAccountsData();
  const accountOptions = Object.entries(accounts).map(([id, account]) => ({ id, name: account.name, type: account.type }));

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
                <Label>To Account</Label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field: { onChange, value, name } }) => (
                    <Combobox
                      autoFocus={selectedContributionRuleID === null}
                      name={name}
                      options={accountOptions}
                      displayValue={(account) => account?.name || ''}
                      value={accountOptions.find((account) => account.id === value) || null}
                      onChange={(account) => onChange(account?.id || null)}
                      placeholder="Select account&hellip;"
                      filter={(account, query) => {
                        if (!account) return false;

                        return (
                          account.name.toLowerCase().includes(query.toLowerCase()) ||
                          account.type.toLowerCase().includes(query.toLowerCase())
                        );
                      }}
                    >
                      {(account) => (
                        <ComboboxOption value={account}>
                          <ComboboxLabel>{account.name}</ComboboxLabel>
                          <ComboboxDescription>{accountTypeForDisplay(account.type)}</ComboboxDescription>
                        </ComboboxOption>
                      )}
                    </Combobox>
                  )}
                />
              </Field>
              <Field>
                <Label htmlFor="maxValue">Maximum Value</Label>
                <NumberInputV2
                  name="maxValue"
                  control={control}
                  id="maxValue"
                  inputMode="decimal"
                  placeholder="$15,000"
                  prefix="$"
                  autoFocus={selectedContributionRuleID !== null}
                />
                {errors.maxValue && <ErrorMessage>{errors.maxValue?.message}</ErrorMessage>}
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
