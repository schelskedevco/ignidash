'use client';

import { useEffect } from 'react';
import { HourglassIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';

import { useUpdateTimelines, useTimelineData } from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { timelineFormSchema, type TimelineInputs, type RetirementStrategyInputs } from '@/lib/schemas/timeline-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Divider } from '@/components/catalyst/divider';

function getRetirementStrategyDesc(retirementStrategyType: 'fixedAge' | 'swrTarget') {
  switch (retirementStrategyType) {
    case 'fixedAge':
      return <>Simulations will always retire at this age.</>;
    case 'swrTarget':
      return (
        <>
          Simulations will retire when your portfolio can support your typical annual expenses at this SWR.{' '}
          <a
            href="https://www.investopedia.com/terms/s/safe-withdrawal-rate-swr-method.asp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hidden hover:underline sm:inline"
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

const newTimelineDefaultValues = {
  id: '',
  retirementStrategy: {
    type: 'swrTarget',
    safeWithdrawalRate: 4,
    // expenseMetric: 'median',
  },
} as const satisfies Partial<TimelineInputs>;

interface TimelineDialogProps {
  onClose: () => void;
  selectedTimelineID: string | null;
}

export default function TimelineDialog({ onClose, selectedTimelineID }: TimelineDialogProps) {
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
    const timelineId = data.id === '' ? uuidv4() : data.id;
    updateTimelines({ ...data, id: timelineId });
    onClose();
  };

  const retirementStrategyType = useWatch({ control, name: 'retirementStrategy.type' });

  useEffect(() => {
    if (retirementStrategyType !== 'swrTarget') {
      unregister('retirementStrategy.safeWithdrawalRate');
      // unregister('retirementStrategy.expenseMetric');
    }

    if (retirementStrategyType !== 'fixedAge') {
      unregister('retirementStrategy.retirementAge');
    }
  }, [retirementStrategyType, unregister]);

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
          <DialogBody>
            <FieldGroup>
              <Field>
                <Label htmlFor="currentAge">Current Age</Label>
                <NumberInputV2 name="currentAge" control={control} id="currentAge" inputMode="numeric" placeholder="35" autoFocus />
                {errors.currentAge && <ErrorMessage>{errors.currentAge?.message}</ErrorMessage>}
              </Field>
              <Field>
                <Label htmlFor="lifeExpectancy">Life Expectancy</Label>
                <NumberInputV2 name="lifeExpectancy" control={control} id="lifeExpectancy" inputMode="numeric" placeholder="78" />
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
                  <NumberInputV2
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
                <>
                  <Field>
                    <Label htmlFor="retirementStrategy.safeWithdrawalRate">Safe Withdrawal Rate (SWR)</Label>
                    <NumberInputV2
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
                  {/* <Field>
                    <Label htmlFor="retirementStrategy.expenseMetric">Expense Metric</Label>
                    <Select
                      {...register('retirementStrategy.expenseMetric')}
                      id="retirementStrategy.expenseMetric"
                      name="retirementStrategy.expenseMetric"
                    >
                      <option value="median">Median</option>
                      <option value="mean">Mean</option>
                    </Select>
                    <Description>Placeholder Text.</Description>
                  </Field> */}
                </>
              )}
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
