'use client';

import { useEffect } from 'react';
import { HourglassIcon, ArmchairIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';

import { useUpdateTimelines, useTimelineData } from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { timelineFormSchema, type TimelineInputs, type RetirementStrategyInputs } from '@/lib/schemas/timeline-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';

const newTimelineDefaultValues = {
  retirementStrategy: {
    type: 'dynamic-age',
    safeWithdrawalRate: 4,
    expenseMetric: 'median',
  },
} as const satisfies Partial<TimelineInputs>;

interface TimelineDialogProps {
  setTimelineDialogOpen: (open: boolean) => void;
  selectedTimelineID: string | null;
}

export default function TimelineDialog({ setTimelineDialogOpen, selectedTimelineID }: TimelineDialogProps) {
  const existingTimelineData = useTimelineData(selectedTimelineID);
  const defaultValues = (existingTimelineData || newTimelineDefaultValues) as never;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(timelineFormSchema),
    defaultValues,
  });

  const updateTimelines = useUpdateTimelines();
  const onSubmit = (data: TimelineInputs) => {
    const timelineID = selectedTimelineID ?? uuidv4();
    updateTimelines(timelineID, data);
    setTimelineDialogOpen(false);
  };

  const retirementStrategyType = useWatch({ control, name: 'retirementStrategy.type' });
  const safeWithdrawalRate = useWatch({ control, name: 'retirementStrategy.safeWithdrawalRate' });
  const fixedRetirementAge = useWatch({ control, name: 'retirementStrategy.retirementAge' });

  useEffect(() => {
    if (retirementStrategyType !== 'dynamic-age') {
      unregister('retirementStrategy.safeWithdrawalRate');
      unregister('retirementStrategy.expenseMetric');
    }

    if (retirementStrategyType !== 'fixed-age') {
      unregister('retirementStrategy.retirementAge');
    }
  }, [retirementStrategyType, unregister]);

  const getRetirementStrategyTypeSpan = () => {
    switch (retirementStrategyType) {
      case 'fixed-age':
        return 'col-span-1';
      case 'dynamic-age':
        return 'col-span-2';
    }
  };

  const getRetirementDisclosureDesc = () => {
    switch (retirementStrategyType) {
      case 'dynamic-age':
        if (!safeWithdrawalRate) {
          return 'SWR: N/A';
        }

        const swrAsNum = Number(safeWithdrawalRate);
        if (swrAsNum < 2) {
          return 'SWR: Too Low!';
        } else if (swrAsNum > 6) {
          return 'SWR: Too High!';
        }

        return `SWR: ${swrAsNum + '%'}`;
      case 'fixed-age':
        if (!fixedRetirementAge) {
          return 'At Age: N/A';
        }

        const fixedRetirementAgeAsNum = Number(fixedRetirementAge);
        if (fixedRetirementAgeAsNum < 17) {
          return 'At Age: Too Early!';
        } else if (fixedRetirementAgeAsNum > 73) {
          return 'At Age: Too Late!';
        }

        return `At Age: ${fixedRetirementAge}`;
    }
  };

  return (
    <>
      <DialogTitle>
        <div className="flex items-center gap-4">
          <HourglassIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>New Timeline</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Timeline details">
          <DialogBody data-slot="control" className="space-y-4">
            <Field>
              <Label htmlFor="currentAge">Current Age</Label>
              <NumberInputV2 name="currentAge" control={control} id="currentAge" inputMode="numeric" placeholder="35" autoFocus />
              {errors.currentAge && <ErrorMessage>{errors.currentAge?.message}</ErrorMessage>}
              <Description>The age your simulation will start at.</Description>
            </Field>
            <Field>
              <Label htmlFor="lifeExpectancy">Life Expectancy</Label>
              <NumberInputV2 name="lifeExpectancy" control={control} id="lifeExpectancy" inputMode="numeric" placeholder="78" />
              {errors.lifeExpectancy && <ErrorMessage>{errors.lifeExpectancy?.message}</ErrorMessage>}
              <Description>The age your simulation will end at.</Description>
            </Field>
            <Disclosure as="div" className="border-border/50 border-t py-4">
              {({ open, close }) => (
                <>
                  <DisclosureButton className="group data-open:border-border/25 focus-outline flex w-full items-start justify-between text-left transition-opacity duration-150 hover:opacity-75 data-open:border-b data-open:pb-4">
                    <div className="flex items-center gap-2">
                      <ArmchairIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                      <span className="text-base/7 font-semibold">Retirement</span>
                      <span className="hidden sm:inline">|</span>
                      <span className="text-muted-foreground hidden truncate sm:inline">{getRetirementDisclosureDesc()}</span>
                    </div>
                    <span className="text-muted-foreground ml-6 flex h-7 items-center">
                      <PlusIcon aria-hidden="true" className="size-6 group-data-open:hidden" />
                      <MinusIcon aria-hidden="true" className="size-6 group-not-data-open:hidden" />
                    </span>
                  </DisclosureButton>
                  <DisclosurePanel className="py-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                      <Field className={getRetirementStrategyTypeSpan()}>
                        <Label htmlFor="retirementStrategy.type">Strategy</Label>
                        <Select {...register('retirementStrategy.type')} id="retirementStrategy.type" name="retirementStrategy.type">
                          <option value="fixed-age">Fixed Age</option>
                          <option value="dynamic-age">Dynamic Age</option>
                        </Select>
                      </Field>
                      {retirementStrategyType === 'fixed-age' && (
                        <Field>
                          <Label htmlFor="retirementStrategy.retirementAge">Retirement Age</Label>
                          <NumberInputV2
                            name="retirementStrategy.retirementAge"
                            control={control}
                            id="retirementStrategy.retirementAge"
                            inputMode="numeric"
                            placeholder="62"
                          />
                          {(errors.retirementStrategy as FieldErrors<Extract<RetirementStrategyInputs, { type: 'fixed-age' }>>)
                            ?.retirementAge?.message && (
                            <ErrorMessage>
                              {
                                (errors.retirementStrategy as FieldErrors<Extract<RetirementStrategyInputs, { type: 'fixed-age' }>>)
                                  ?.retirementAge?.message
                              }
                            </ErrorMessage>
                          )}
                        </Field>
                      )}
                      {retirementStrategyType === 'dynamic-age' && (
                        <>
                          <Field>
                            <Label htmlFor="retirementStrategy.safeWithdrawalRate">Safe Withdrawal Rate</Label>
                            <NumberInputV2
                              name="retirementStrategy.safeWithdrawalRate"
                              control={control}
                              id="retirementStrategy.safeWithdrawalRate"
                              inputMode="decimal"
                              placeholder="4"
                              suffix="%"
                            />
                            {(errors.retirementStrategy as FieldErrors<Extract<RetirementStrategyInputs, { type: 'dynamic-age' }>>)
                              ?.safeWithdrawalRate?.message && (
                              <ErrorMessage>
                                {
                                  (errors.retirementStrategy as FieldErrors<Extract<RetirementStrategyInputs, { type: 'dynamic-age' }>>)
                                    ?.safeWithdrawalRate?.message
                                }
                              </ErrorMessage>
                            )}
                          </Field>
                          <Field>
                            <Label htmlFor="retirementStrategy.expenseMetric">Expense Metric</Label>
                            <Select
                              {...register('retirementStrategy.expenseMetric')}
                              id="retirementStrategy.expenseMetric"
                              name="retirementStrategy.expenseMetric"
                            >
                              <option value="median">Median</option>
                              <option value="mean">Mean</option>
                            </Select>
                          </Field>
                        </>
                      )}
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={() => setTimelineDialogOpen(false)}>
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
