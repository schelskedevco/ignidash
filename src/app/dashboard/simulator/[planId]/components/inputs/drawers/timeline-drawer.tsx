'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';

import { timelineToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { timelineFormSchema, type TimelineInputs, type RetirementStrategyInputs } from '@/lib/schemas/inputs/timeline-form-schema';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

function getRetirementStrategyDesc(retirementStrategyType: 'fixedAge' | 'swrTarget') {
  switch (retirementStrategyType) {
    case 'fixedAge':
      return <>Simulations will always retire at this age.</>;
    case 'swrTarget':
      return (
        <>
          Simulations will retire when your portfolio can support your typical annual expenses at this SWR. <br />
          <a
            href="https://www.investopedia.com/terms/s/safe-withdrawal-rate-swr-method.asp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hidden whitespace-nowrap hover:underline sm:inline"
          >
            Learn more →
          </a>
        </>
      );
  }
}

function getRetirementStrategyError(errors: FieldErrors, retirementStrategyType: 'fixedAge' | 'swrTarget') {
  switch (retirementStrategyType) {
    case 'fixedAge':
      return (errors.retirementStrategy as FieldErrors<Extract<RetirementStrategyInputs, { type: 'fixedAge' }>>)?.retirementAge?.message;
    case 'swrTarget':
      return (errors.retirementStrategy as FieldErrors<Extract<RetirementStrategyInputs, { type: 'swrTarget' }>>)?.safeWithdrawalRate
        ?.message;
  }
}

interface TimelineDrawerProps {
  setOpen: (open: boolean) => void;
  timeline: TimelineInputs | null;
}

export default function TimelineDrawer({ setOpen, timeline }: TimelineDrawerProps) {
  const planId = useSelectedPlanId();

  const timelineDefaultValues = useMemo(
    () =>
      ({
        retirementStrategy: {
          type: 'swrTarget',
          safeWithdrawalRate: 4,
        },
      }) as const satisfies Partial<TimelineInputs>,
    []
  );

  const defaultValues = timeline || timelineDefaultValues;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(timelineFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (timeline) reset(timeline);
  }, [timeline, reset]);

  const m = useMutation(api.timeline.update);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: TimelineInputs) => {
    try {
      setSaveError(null);
      await m({ timeline: timelineToConvex(data)!, planId });
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save timeline.');
      console.error('Error saving timeline: ', error);
    }
  };

  const retirementStrategyType = useWatch({ control, name: 'retirementStrategy.type' });

  useEffect(() => {
    if (retirementStrategyType !== 'swrTarget') {
      unregister('retirementStrategy.safeWithdrawalRate');
    }

    if (retirementStrategyType !== 'fixedAge') {
      unregister('retirementStrategy.retirementAge');
    }
  }, [retirementStrategyType, unregister]);

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader
          title="Timeline"
          desc="Configure when your simulation should start, when it should end, and when you want to retire."
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="Timeline details">
              <FieldGroup>
                {saveError && <ErrorMessageCard errorMessage={saveError} />}
                <Field>
                  <Label htmlFor="currentAge">Current Age</Label>
                  <NumberInput
                    name="currentAge"
                    control={control}
                    id="currentAge"
                    inputMode="numeric"
                    placeholder="35"
                    autoFocus={timeline === null}
                  />
                  {errors.currentAge && <ErrorMessage>{errors.currentAge?.message}</ErrorMessage>}
                </Field>
                <Field>
                  <Label htmlFor="lifeExpectancy">Life Expectancy</Label>
                  <NumberInput name="lifeExpectancy" control={control} id="lifeExpectancy" inputMode="numeric" placeholder="78" />
                  {errors.lifeExpectancy && <ErrorMessage>{errors.lifeExpectancy?.message}</ErrorMessage>}
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="retirementStrategy.type">Retirement Trigger</Label>
                  <Select {...register('retirementStrategy.type')} id="retirementStrategy.type" name="retirementStrategy.type">
                    <option value="fixedAge">Fixed Age</option>
                    <option value="swrTarget">SWR Target</option>
                  </Select>
                </Field>
                {retirementStrategyType === 'fixedAge' && (
                  <Field>
                    <Label htmlFor="retirementStrategy.retirementAge">Retirement Age</Label>
                    <NumberInput
                      name="retirementStrategy.retirementAge"
                      control={control}
                      id="retirementStrategy.retirementAge"
                      inputMode="numeric"
                      placeholder="62"
                      autoFocus={timeline !== null}
                    />
                    <ErrorMessage>{getRetirementStrategyError(errors, retirementStrategyType)}</ErrorMessage>
                    <Description>{getRetirementStrategyDesc(retirementStrategyType)}</Description>
                  </Field>
                )}
                {retirementStrategyType === 'swrTarget' && (
                  <Field>
                    <Label htmlFor="retirementStrategy.safeWithdrawalRate">Safe Withdrawal Rate</Label>
                    <NumberInput
                      name="retirementStrategy.safeWithdrawalRate"
                      control={control}
                      id="retirementStrategy.safeWithdrawalRate"
                      inputMode="decimal"
                      placeholder="4%"
                      suffix="%"
                      autoFocus={timeline !== null}
                    />
                    <ErrorMessage>{getRetirementStrategyError(errors, retirementStrategyType)}</ErrorMessage>
                    <Description>{getRetirementStrategyDesc(retirementStrategyType)}</Description>
                  </Field>
                )}
                <Divider />
              </FieldGroup>
            </Fieldset>
            <DialogActions>
              <Button outline onClick={() => reset()}>
                Reset
              </Button>
              <Button color="rose" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
