'use client';

import { useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';

import { useUpdateTimeline, useTimelineData } from '@/lib/stores/quick-plan-store';
import { timelineFormSchema, type TimelineInputs, type RetirementStrategyInputs } from '@/lib/schemas/timeline-form-schema';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';

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
}

export default function TimelineDrawer({ setOpen }: TimelineDrawerProps) {
  const existingTimelineData = useTimelineData();

  const newTimelineDefaultValues = useMemo(
    () =>
      ({
        name: 'Timeline 1',
        id: '',
        retirementStrategy: {
          type: 'swrTarget',
          safeWithdrawalRate: 4,
        },
      }) as const satisfies Partial<TimelineInputs>,
    []
  );

  const defaultValues = (existingTimelineData || newTimelineDefaultValues) as never;

  const {
    register,
    unregister,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(timelineFormSchema),
    defaultValues,
  });

  const updateTimeline = useUpdateTimeline();
  const onSubmit = (data: TimelineInputs) => {
    const timelineId = data.id === '' ? uuidv4() : data.id;
    updateTimeline({ ...data, id: timelineId });
    setOpen(false);
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
        <SectionHeader title="Timeline" desc="Set when your simulation should start, when it should end, and when you want to retire." />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="Timeline details">
              <FieldGroup>
                <Field>
                  <Label htmlFor="currentAge">Current Age</Label>
                  <NumberInput name="currentAge" control={control} id="currentAge" inputMode="numeric" placeholder="35" />
                  {errors.currentAge && <ErrorMessage>{errors.currentAge?.message}</ErrorMessage>}
                </Field>
                <Divider />
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
              <Button color="rose" type="submit">
                Save
              </Button>
            </DialogActions>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
