'use client';

import { useEffect } from 'react';
import { PiggyBankIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller, FieldErrors } from 'react-hook-form';

import {
  useUpdateContributionRules,
  useContributionRuleData,
  useContributionRulesData,
  useAccountsData,
  useIncomesData,
} from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { contributionFormSchema, type ContributionInputs } from '@/lib/schemas/contribution-form-schema';
import { accountTypeForDisplay, accountTypeRequiresIncomeForContributions } from '@/lib/schemas/account-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import { Combobox, ComboboxLabel, ComboboxDescription, ComboboxOption } from '@/components/catalyst/combobox';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';

interface ContributionRuleDialogProps {
  onClose: () => void;
  selectedContributionRuleID: string | null;
}

export default function ContributionRuleDialog({ onClose, selectedContributionRuleID }: ContributionRuleDialogProps) {
  const existingContributionRuleData = useContributionRuleData(selectedContributionRuleID);

  const contributionRules = useContributionRulesData();
  const contributionRulesCount = Object.entries(contributionRules).length;
  const defaultRank = contributionRulesCount + 1;
  const newContributionRuleDefaultValues = {
    id: '',
    rank: defaultRank,
    contributionType: 'dollarAmount' as ContributionInputs['contributionType'],
  } as const satisfies Partial<ContributionInputs>;

  const defaultValues = (existingContributionRuleData || newContributionRuleDefaultValues) as never;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contributionFormSchema),
    defaultValues,
  });

  const updateContributionRules = useUpdateContributionRules();
  const onSubmit = (data: ContributionInputs) => {
    const contributionRuleId = data.id === '' ? uuidv4() : data.id;
    updateContributionRules({ ...data, id: contributionRuleId });
    onClose();
  };

  const contributionType = useWatch({ control, name: 'contributionType' });
  const accountId = useWatch({ control, name: 'accountId' });

  const getAllocationTypeColSpan = () => {
    if (contributionType === 'dollarAmount' || contributionType === 'percentRemaining') return 'col-span-1';
    return 'col-span-2';
  };

  const accounts = useAccountsData();
  const accountOptions = Object.entries(accounts).map(([id, account]) => ({ id, name: account.name, type: account.type }));
  const selectedAccount = accountId ? accounts[accountId] : null;

  const incomes = useIncomesData();
  const incomeOptions = Object.entries(incomes).map(([id, income]) => ({ id, name: income.name }));

  useEffect(() => {
    if (contributionType === 'unlimited') {
      unregister('amount');
    }

    if (!(selectedAccount && accountTypeRequiresIncomeForContributions(selectedAccount.type))) {
      unregister('incomeIds');
    }
  }, [contributionType, unregister, selectedAccount]);

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
                <Label>For Account</Label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field: { onChange, value, name } }) => (
                    <Combobox
                      name={name}
                      options={accountOptions}
                      displayValue={(account) => account?.name}
                      placeholder="Select account&hellip;"
                      value={accountOptions.find((account) => account.id === value) || null}
                      onChange={(account) => onChange(account?.id || null)}
                      autoFocus={selectedContributionRuleID === null}
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
                {errors.accountId && <ErrorMessage>{errors.accountId?.message}</ErrorMessage>}
              </Field>
              {selectedAccount && accountTypeRequiresIncomeForContributions(selectedAccount.type) && (
                <Field>
                  <Label htmlFor="incomeIds">With Income(s)</Label>
                  <Select {...register('incomeIds')} id="incomeIds" name="incomeIds" multiple>
                    {incomeOptions.map((income) => (
                      <option key={income.id} value={income.id}>
                        {income.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Field className={getAllocationTypeColSpan()}>
                  <Label htmlFor="contributionType">Contribution Strategy</Label>
                  <Select {...register('contributionType')} id="contributionType" name="contributionType">
                    <option value="dollarAmount">Dollar Amount</option>
                    <option value="percentRemaining">% Remaining</option>
                    <option value="unlimited">Unlimited</option>
                  </Select>
                </Field>
                {contributionType === 'dollarAmount' && (
                  <Field>
                    <Label>Amount</Label>
                    <NumberInputV2 name="amount" control={control} id="amount" inputMode="decimal" placeholder="$2,500" prefix="$" />
                    {(errors as FieldErrors<Extract<ContributionInputs, { contributionType: 'dollarAmount' }>>).amount?.message && (
                      <ErrorMessage>
                        {(errors as FieldErrors<Extract<ContributionInputs, { contributionType: 'dollarAmount' }>>).amount?.message}
                      </ErrorMessage>
                    )}
                  </Field>
                )}
                {contributionType === 'percentRemaining' && (
                  <Field>
                    <Label>Percent</Label>
                    <NumberInputV2 name="amount" control={control} id="amount" inputMode="decimal" placeholder="25%" suffix="%" />
                    {(errors as FieldErrors<Extract<ContributionInputs, { contributionType: 'percentRemaining' }>>).amount?.message && (
                      <ErrorMessage>
                        {(errors as FieldErrors<Extract<ContributionInputs, { contributionType: 'percentRemaining' }>>).amount?.message}
                      </ErrorMessage>
                    )}
                  </Field>
                )}
              </div>
              <Field>
                <Label htmlFor="maxValue" className="flex w-full items-center justify-between">
                  <span className="whitespace-nowrap">Max Total Value</span>
                  <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                </Label>
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
                <Description>Set a limit on the total value of this account. Contributions stop once reached.</Description>
              </Field>
            </FieldGroup>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={onClose}>
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
