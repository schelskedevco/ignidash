'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useMemo, useState } from 'react';
import { HandCoinsIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import posthog from 'posthog-js';

import { useAccountsData, useIncomesData, useTimelineData } from '@/hooks/use-convex-data';
import { contributionToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import {
  contributionFormSchema,
  type ContributionInputs,
  supportsMaxBalance,
  supportsIncomeAllocation,
  supportsEmployerMatch,
  getAccountTypeLimitKey,
  getAnnualContributionLimit,
} from '@/lib/schemas/inputs/contribution-form-schema';
import { accountTypeForDisplay } from '@/lib/schemas/inputs/account-form-schema';
import { calculateAge } from '@/lib/schemas/inputs/timeline-form-schema';
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { getErrorMessages } from '@/lib/utils/form-utils';

interface ContributionRuleDialogProps {
  onClose: () => void;
  selectedContributionRule: ContributionInputs | null;
  numContributionRules: number;
}

export default function ContributionRuleDialog({
  onClose,
  selectedContributionRule: _selectedContributionRule,
  numContributionRules,
}: ContributionRuleDialogProps) {
  const planId = useSelectedPlanId();
  const [selectedContributionRule] = useState(_selectedContributionRule);

  const defaultRank = numContributionRules + 1;
  const newContributionRuleDefaultValues = useMemo(
    () =>
      ({
        id: '',
        rank: defaultRank,
        contributionType: 'unlimited' as ContributionInputs['contributionType'],
      }) as const satisfies Partial<ContributionInputs>,
    [defaultRank]
  );

  const defaultValues = (selectedContributionRule || newContributionRuleDefaultValues) as never;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contributionFormSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.contribution_rule.upsertContributionRule);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: ContributionInputs) => {
    const contributionRuleId = data.id === '' ? uuidv4() : data.id;
    try {
      setSaveError(null);
      posthog.capture('save_contribution_rule', { plan_id: planId, save_mode: selectedContributionRule ? 'edit' : 'create' });
      await m({ contributionRule: contributionToConvex({ ...data, id: contributionRuleId }), planId });
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save contribution rule.');
      console.error('Error saving contribution rule: ', error);
    }
  };

  const contributionType = useWatch({ control, name: 'contributionType' });
  const accountId = useWatch({ control, name: 'accountId' });

  const getContributionTypeColSpan = () => {
    if (contributionType === 'dollarAmount' || contributionType === 'percentRemaining') return 'col-span-1';
    return 'col-span-2';
  };

  const { data: accounts } = useAccountsData();
  const accountOptions = Object.entries(accounts).map(([id, account]) => ({ id, name: account.name, type: account.type }));
  const selectedAccount = accountId ? accounts[accountId] : null;

  const timeline = useTimelineData();
  const currentAge = timeline ? calculateAge(timeline.birthMonth, timeline.birthYear) : 18;
  const selectedAccountAnnualContributionLimit = selectedAccount
    ? getAnnualContributionLimit(getAccountTypeLimitKey(selectedAccount.type), currentAge)
    : null;

  const { data: incomes } = useIncomesData();
  const incomeOptions = Object.entries(incomes).map(([id, income]) => ({ id, name: income.name }));

  useEffect(() => {
    if (!(contributionType === 'dollarAmount')) {
      unregister('dollarAmount');
    }

    if (!(contributionType === 'percentRemaining')) {
      unregister('percentRemaining');
    }

    if (!(selectedAccount && supportsMaxBalance(selectedAccount.type))) {
      unregister('maxBalance');
    }

    if (!(selectedAccount && supportsIncomeAllocation(selectedAccount.type))) {
      unregister('incomeIds');
    }

    if (!(selectedAccount && supportsEmployerMatch(selectedAccount.type))) {
      unregister('employerMatch');
    }
  }, [contributionType, unregister, selectedAccount]);

  const { error: dollarAmountError } = getFieldState('dollarAmount');
  const { error: percentRemainingError } = getFieldState('percentRemaining');

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <HandCoinsIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedContributionRule ? 'Edit Contribution' : 'New Contribution'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Contribution details">
          <DialogBody>
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
              <Field>
                <Label htmlFor="accountId">To Account</Label>
                <Select {...register('accountId')} id="accountId" name="accountId" defaultValue="" invalid={!!errors.accountId}>
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
                {selectedAccountAnnualContributionLimit !== null && Number.isFinite(selectedAccountAnnualContributionLimit) && (
                  <Description>
                    You can contribute up to <strong>{formatNumber(selectedAccountAnnualContributionLimit, 0, '$')}</strong> per year.
                  </Description>
                )}
              </Field>
              {selectedAccount && supportsIncomeAllocation(selectedAccount.type) && (
                <Field>
                  <Label htmlFor="incomeIds">With Income(s)</Label>
                  <Select {...register('incomeIds')} id="incomeIds" name="incomeIds" multiple invalid={!!errors.incomeIds}>
                    {incomeOptions.map((income) => (
                      <option key={income.id} value={income.id}>
                        {income.name}
                      </option>
                    ))}
                  </Select>
                  {errors.incomeIds && <ErrorMessage>{errors.incomeIds?.message}</ErrorMessage>}
                  <Description>Select specific income(s) to restrict contributions to those sources only.</Description>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Field className={getContributionTypeColSpan()}>
                  <Label htmlFor="contributionType">Type</Label>
                  <Select
                    {...register('contributionType')}
                    id="contributionType"
                    name="contributionType"
                    invalid={!!errors.contributionType}
                  >
                    <option value="dollarAmount">Dollar Amount</option>
                    <option value="percentRemaining">% Remaining</option>
                    <option value="unlimited">Unlimited</option>
                  </Select>
                  {errors.contributionType && <ErrorMessage>{errors.contributionType?.message}</ErrorMessage>}
                </Field>
                {contributionType === 'dollarAmount' && (
                  <Field>
                    <Label htmlFor="dollarAmount">Dollar Amount</Label>
                    <NumberInput
                      name="dollarAmount"
                      control={control}
                      id="dollarAmount"
                      inputMode="decimal"
                      placeholder="$2,500"
                      prefix="$"
                      autoFocus={selectedContributionRule !== null}
                    />
                    {dollarAmountError && <ErrorMessage>{dollarAmountError.message}</ErrorMessage>}
                  </Field>
                )}
                {contributionType === 'percentRemaining' && (
                  <Field>
                    <Label htmlFor="percentRemaining">% Remaining</Label>
                    <NumberInput
                      name="percentRemaining"
                      control={control}
                      id="percentRemaining"
                      inputMode="decimal"
                      placeholder="25%"
                      suffix="%"
                      autoFocus={selectedContributionRule !== null}
                    />
                    {percentRemainingError && <ErrorMessage>{percentRemainingError.message}</ErrorMessage>}
                  </Field>
                )}
              </div>
              {selectedAccount && supportsMaxBalance(selectedAccount.type) && (
                <Field>
                  <Label htmlFor="maxBalance" className="flex w-full items-center justify-between">
                    <span className="whitespace-nowrap">Maximum Balance</span>
                    <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                  </Label>
                  <NumberInput name="maxBalance" control={control} id="maxBalance" inputMode="decimal" placeholder="$15,000" prefix="$" />
                  {errors.maxBalance && <ErrorMessage>{errors.maxBalance?.message}</ErrorMessage>}
                  <Description>Stop contributing to this account once it reaches this balance.</Description>
                </Field>
              )}
              {selectedAccount && supportsEmployerMatch(selectedAccount.type) && (
                <Field>
                  <Label htmlFor="employerMatch" className="flex w-full items-center justify-between">
                    <span className="whitespace-nowrap">Employer Match</span>
                    <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                  </Label>
                  <NumberInput
                    name="employerMatch"
                    control={control}
                    id="employerMatch"
                    inputMode="decimal"
                    placeholder="$7,000"
                    prefix="$"
                  />
                  {errors.employerMatch && <ErrorMessage>{errors.employerMatch?.message}</ErrorMessage>}
                  <Description>Employer will match contributions dollar-for-dollar up to this amount.</Description>
                </Field>
              )}
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
