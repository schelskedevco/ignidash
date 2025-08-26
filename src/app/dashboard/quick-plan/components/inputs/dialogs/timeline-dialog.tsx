'use client';

import { HourglassIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useUpdateTimelines, useTimelineData } from '@/lib/stores/quick-plan-store';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { timelineFormSchema, type TimelineInputs } from '@/lib/schemas/timeline-form-schema';
import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset, Field, Label, ErrorMessage, Description } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';

interface TimelineDialogProps {
  setTimelineDialogOpen: (open: boolean) => void;
  selectedTimelineID: string | null;
}

export default function TimelineDialog({ setTimelineDialogOpen, selectedTimelineID }: TimelineDialogProps) {
  const existingTimelineData = useTimelineData(selectedTimelineID);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(timelineFormSchema),
    defaultValues: existingTimelineData || undefined,
  });

  const updateTimelines = useUpdateTimelines();
  const onSubmit = (data: TimelineInputs) => {
    const timelineID = selectedTimelineID ?? uuidv4();
    updateTimelines(timelineID, data);
    setTimelineDialogOpen(false);
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
            <Field>
              <Label htmlFor="retirementStrategy.type">Retirement Age</Label>
              <Select {...register('retirementStrategy.type')} id="retirementStrategy.type" name="retirementStrategy.type">
                <option value="fixed-age">Fixed Age</option>
                <option value="dynamic-age">Dynamic Age</option>
              </Select>
            </Field>
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
