'use client';

import { useEffect, useMemo } from 'react';
import { HandCoinsIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, FieldErrors } from 'react-hook-form';

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
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Divider } from '@/components/catalyst/divider';

interface ContributionRuleDialogProps {
  onClose: () => void;
  selectedContributionRuleID: string | null;
}

export default function ContributionRuleDialog({ onClose, selectedContributionRuleID }: ContributionRuleDialogProps) {
  const existingContributionRuleData = useContributionRuleData(selectedContributionRuleID);

  const contributionRules = useContributionRulesData();
  const contributionRulesCount = Object.entries(contributionRules).length;
  const defaultRank = contributionRulesCount + 1;
  const newContributionRuleDefaultValues = useMemo(
    () =>
      ({
        id: '',
        rank: defaultRank,
        contributionType: 'dollarAmount' as ContributionInputs['contributionType'],
      }) as const satisfies Partial<ContributionInputs>,
    [defaultRank]
  );

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

  const getContributionTypeColSpan = () => {
    if (contributionType === 'dollarAmount' || contributionType === 'percentRemaining') return 'col-span-1';
    return 'col-span-2';
  };

  const accounts = useAccountsData();
  const accountOptions = Object.entries(accounts).map(([id, account]) => ({ id, name: account.name, type: account.type }));
  const selectedAccount = accountId ? accounts[accountId] : null;

  const incomes = useIncomesData();
  const incomeOptions = Object.entries(incomes).map(([id, income]) => ({ id, name: income.name }));

  useEffect(() => {
    if (!(contributionType === 'dollarAmount')) {
      unregister('dollarAmount');
    }

    if (!(contributionType === 'percentRemaining')) {
      unregister('percentRemaining');
    }

    if (!(selectedAccount && accountTypeRequiresIncomeForContributions(selectedAccount.type))) {
      unregister('incomeIds');
    }
  }, [contributionType, unregister, selectedAccount]);

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <HandCoinsIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedContributionRuleID ? 'Edit Contribution' : 'New Contribution'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Contribution details">
          <DialogBody>
            <FieldGroup>
              <Field>
                <Label htmlFor="accountId">To Account</Label>
                <Select {...register('accountId')} name="accountId" defaultValue="" invalid={!!errors.accountId}>
                  <option value="" disabled>
                    Select account&hellip;
                  </option>
                  {accountOptions.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} | {accountTypeForDisplay(account.type)}
                    </option>
                  ))}
                </Select>
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
                <Field className={getContributionTypeColSpan()}>
                  <Label htmlFor="contributionType">Type</Label>
                  <Select {...register('contributionType')} id="contributionType" name="contributionType">
                    <option value="dollarAmount">Dollar Amount</option>
                    <option value="percentRemaining">% Remaining</option>
                    <option value="unlimited">Unlimited</option>
                  </Select>
                </Field>
                {contributionType === 'dollarAmount' && (
                  <Field>
                    <Label htmlFor="dollarAmount">Dollar Amount</Label>
                    <NumberInputV2
                      name="dollarAmount"
                      control={control}
                      id="dollarAmount"
                      inputMode="decimal"
                      placeholder="$2,500"
                      prefix="$"
                      autoFocus={selectedContributionRuleID !== null}
                    />
                    {(errors as FieldErrors<Extract<ContributionInputs, { contributionType: 'dollarAmount' }>>).dollarAmount?.message && (
                      <ErrorMessage>
                        {(errors as FieldErrors<Extract<ContributionInputs, { contributionType: 'dollarAmount' }>>).dollarAmount?.message}
                      </ErrorMessage>
                    )}
                  </Field>
                )}
                {contributionType === 'percentRemaining' && (
                  <Field>
                    <Label htmlFor="percentRemaining">% Remaining</Label>
                    <NumberInputV2
                      name="percentRemaining"
                      control={control}
                      id="percentRemaining"
                      inputMode="decimal"
                      placeholder="25%"
                      suffix="%"
                      autoFocus={selectedContributionRuleID !== null}
                    />
                    {(errors as FieldErrors<Extract<ContributionInputs, { contributionType: 'percentRemaining' }>>).percentRemaining
                      ?.message && (
                      <ErrorMessage>
                        {
                          (errors as FieldErrors<Extract<ContributionInputs, { contributionType: 'percentRemaining' }>>).percentRemaining
                            ?.message
                        }
                      </ErrorMessage>
                    )}
                  </Field>
                )}
              </div>
              <Divider />
              <Field>
                <Label htmlFor="maxValue" className="flex w-full items-center justify-between">
                  <span className="whitespace-nowrap">Account Limit</span>
                  <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                </Label>
                <NumberInputV2 name="maxValue" control={control} id="maxValue" inputMode="decimal" placeholder="$15,000" prefix="$" />
                {errors.maxValue && <ErrorMessage>{errors.maxValue?.message}</ErrorMessage>}
                <Description>Limit on the total value of this account. Contributions will stop once reached.</Description>
              </Field>
            </FieldGroup>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={onClose} className="hidden sm:inline-flex">
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
