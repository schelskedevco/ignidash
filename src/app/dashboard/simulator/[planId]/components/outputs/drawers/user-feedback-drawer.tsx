'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import posthog from 'posthog-js';

import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Field, FieldGroup, Fieldset, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { type UserFeedbackInputs, userFeedbackSchema } from '@/lib/schemas/user-feedback-schema';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { Textarea } from '@/components/catalyst/textarea';
import { DialogActions } from '@/components/catalyst/dialog';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

interface UserFeedbackDrawerProps {
  setOpen: (open: boolean) => void;
}

export default function UserFeedbackDrawer({ setOpen }: UserFeedbackDrawerProps) {
  const planId = useSelectedPlanId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userFeedbackSchema),
    defaultValues: { feedback: '' },
  });

  const m = useMutation(api.user_feedback.send);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: UserFeedbackInputs) => {
    try {
      setSaveError(null);
      posthog.capture('submit_user_feedback', { plan_id: planId, feedback_length: data.feedback.length });
      await m({ feedback: { planId, feedback: data.feedback } });
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to send user feedback.');
      console.error('Error sending user feedback: ', error);
    }
  };

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Share Feedback" desc="Let us know if something's not working or if you have suggestions for new features." />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="User feedback">
              <FieldGroup>
                {saveError && <ErrorMessageCard errorMessage={saveError} />}
                <Field>
                  <Textarea
                    autoFocus
                    {...register('feedback')}
                    id="feedback"
                    name="feedback"
                    aria-label="User feedback"
                    resizable={false}
                    rows={6}
                  />
                  {errors.feedback && <ErrorMessage>{errors.feedback?.message}</ErrorMessage>}
                  <Description>Your feedback helps us prioritize improvements. We&apos;ll follow up by email if needed.</Description>
                </Field>
                <Divider />
              </FieldGroup>
            </Fieldset>
            <DialogActions>
              <Button outline onClick={() => reset()}>
                Reset
              </Button>
              <Button color="rose" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </DialogActions>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
