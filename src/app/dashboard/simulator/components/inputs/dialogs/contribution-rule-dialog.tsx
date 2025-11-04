'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { HandCoinsIcon, GiftIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import type { DisclosureState } from '@/lib/types/disclosure-state';
import {
  useUpdateContributionRules,
  useContributionRuleData,
  useContributionRulesData,
  useAccountsData,
  useIncomesData,
  useTimelineData,
} from '@/lib/stores/simulator-store';
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
import NumberInput from '@/components/ui/number-input';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';

interface ContributionRuleDialogProps {
  onClose: () => void;
  selectedContributionRuleID: string | null;
}

export default function ContributionRuleDialog({ onClose, selectedContributionRuleID }: ContributionRuleDialogProps) {
  const existingContributionRuleData = useContributionRuleData(selectedContributionRuleID);

  const contributionRules = useContributionRulesData();
  const contributionRulesCount = Object.keys(contributionRules).length;
  const defaultRank = contributionRulesCount + 1;
  const newContributionRuleDefaultValues = useMemo(
    () =>
      ({
        id: '',
        rank: defaultRank,
        contributionType: 'unlimited' as ContributionInputs['contributionType'],
      }) as const satisfies Partial<ContributionInputs>,
    [defaultRank]
  );

  const defaultValues = (existingContributionRuleData || newContributionRuleDefaultValues) as never;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    getFieldState,
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
  const matchType = useWatch({ control, name: 'employerMatch.matchType' });

  const getContributionTypeColSpan = () => {
    if (contributionType === 'dollarAmount' || contributionType === 'percentRemaining') return 'col-span-1';
    return 'col-span-2';
  };

  const accounts = useAccountsData();
  const accountOptions = Object.entries(accounts).map(([id, account]) => ({ id, name: account.name, type: account.type }));
  const selectedAccount = accountId ? accounts[accountId] : null;

  const timeline = useTimelineData();
  const currentAge = timeline?.currentAge ?? 18;
  const selectedAccountAnnualContributionLimit = selectedAccount
    ? getAnnualContributionLimit(getAccountTypeLimitKey(selectedAccount.type), currentAge)
    : null;

  const incomes = useIncomesData();
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

    if (!(matchType === 'rate')) {
      unregister('employerMatch.matchRate');
      unregister('employerMatch.percentSalary');
    }

    if (!(matchType === 'amount')) {
      unregister('employerMatch.matchAmount');
    }
  }, [contributionType, unregister, selectedAccount, matchType]);

  const stopContributionsButtonRef = useRef<HTMLButtonElement>(null);
  const employerMatchButtonRef = useRef<HTMLButtonElement>(null);

  const [activeDisclosure, setActiveDisclosure] = useState<DisclosureState | null>(null);
  const toggleDisclosure = useCallback(
    (newDisclosure: DisclosureState) => {
      if (activeDisclosure?.open && activeDisclosure.key !== newDisclosure.key) {
        let targetRef = undefined;
        switch (newDisclosure.key) {
          case 'stopContributions':
            targetRef = stopContributionsButtonRef.current;
            break;
          case 'employerMatch':
            targetRef = employerMatchButtonRef.current;
            break;
        }

        activeDisclosure.close(targetRef || undefined);
      }

      setActiveDisclosure({
        ...newDisclosure,
        open: !newDisclosure.open,
      });
    },
    [activeDisclosure]
  );

  // Contribution type errors
  const { error: dollarAmountError } = getFieldState('dollarAmount');
  const { error: percentRemainingError } = getFieldState('percentRemaining');

  // Employer match errors
  const { error: matchRateError } = getFieldState('employerMatch.matchRate');
  const { error: percentSalaryError } = getFieldState('employerMatch.percentSalary');
  const { error: matchAmountError } = getFieldState('employerMatch.matchAmount');

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
                </Field>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Field className={getContributionTypeColSpan()}>
                  <Label htmlFor="contributionType">Contribution Type</Label>
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
                      autoFocus={selectedContributionRuleID !== null}
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
                      autoFocus={selectedContributionRuleID !== null}
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
                <Disclosure as="div" className="border-border/50 border-t pt-4">
                  {({ open, close }) => (
                    <>
                      <DisclosureButton
                        ref={employerMatchButtonRef}
                        onClick={() => {
                          if (!open) close();
                          toggleDisclosure({ open, close, key: 'employerMatch' });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            if (!open) close();
                            toggleDisclosure({ open, close, key: 'employerMatch' });
                          }
                        }}
                        className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4"
                      >
                        <div className="flex items-center gap-2">
                          <GiftIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                          <span className="text-base/7 font-semibold">Employer Match</span>
                          <span className="hidden sm:inline">|</span>
                          <span className="text-muted-foreground hidden truncate sm:inline">...</span>
                        </div>
                        <span className="text-muted-foreground ml-6 flex h-7 items-center">
                          <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                          <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                        </span>
                      </DisclosureButton>
                      <DisclosurePanel className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Field className="col-span-2">
                            <Label htmlFor="employerMatch.matchType">Match Type</Label>
                            <Select {...register('employerMatch.matchType')} id="employerMatch.matchType" name="employerMatch.matchType">
                              <option value="none">No Match</option>
                              <option value="rate">% Match</option>
                              <option value="amount">Fixed Amount</option>
                            </Select>
                          </Field>
                          {matchType === 'rate' && (
                            <>
                              <Field>
                                <Label htmlFor="employerMatch.matchRate">Match Rate</Label>
                                <NumberInput
                                  name="employerMatch.matchRate"
                                  control={control}
                                  id="employerMatch.matchRate"
                                  inputMode="decimal"
                                  placeholder="50%"
                                  suffix="%"
                                />
                                {matchRateError && <ErrorMessage>{matchRateError.message}</ErrorMessage>}
                              </Field>
                              <Field>
                                <Label htmlFor="employerMatch.percentSalary">Up to % of Salary</Label>
                                <NumberInput
                                  name="employerMatch.percentSalary"
                                  control={control}
                                  id="employerMatch.percentSalary"
                                  inputMode="decimal"
                                  placeholder="6%"
                                  suffix="%"
                                />
                                {percentSalaryError && <ErrorMessage>{percentSalaryError.message}</ErrorMessage>}
                              </Field>
                            </>
                          )}
                          {matchType === 'amount' && (
                            <Field className="col-span-2">
                              <Label htmlFor="employerMatch.matchAmount">Match Amount</Label>
                              <NumberInput
                                name="employerMatch.matchAmount"
                                control={control}
                                id="employerMatch.matchAmount"
                                inputMode="decimal"
                                placeholder="$3,000"
                                prefix="$"
                              />
                              {matchAmountError && <ErrorMessage>{matchAmountError.message}</ErrorMessage>}
                            </Field>
                          )}
                        </div>
                      </DisclosurePanel>
                    </>
                  )}
                </Disclosure>
              )}
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
