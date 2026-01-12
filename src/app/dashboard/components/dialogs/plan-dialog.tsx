'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { FileTextIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import posthog from 'posthog-js';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { planMetadataSchema, type PlanMetadata } from '@/lib/schemas/plan-metadata-schema';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { getErrorMessages } from '@/lib/utils/form-utils';

interface PlanDialogProps {
  onClose: () => void;
  numPlans: number;
  selectedPlan: Doc<'plans'> | null;
  allPlans: { id: Id<'plans'>; name: string }[];
  planToClone?: { id: Id<'plans'>; name: string };
}

export default function PlanDialog({ onClose, numPlans, selectedPlan: _selectedPlan, allPlans, planToClone }: PlanDialogProps) {
  const [selectedPlan] = useState(_selectedPlan);

  const getDefaultName = () => {
    if (selectedPlan !== null) return selectedPlan.name;
    if (planToClone) return `Copy of ${planToClone.name}`;
    return `Plan ${numPlans + 1}`;
  };

  const defaultValues: PlanMetadata = {
    name: getDefaultName(),
    clonedPlanId: selectedPlan !== null ? undefined : planToClone?.id,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(planMetadataSchema),
    defaultValues,
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const updateNameMutation = useMutation(api.plans.updatePlanName);
  const clonePlanMutation = useMutation(api.plans.clonePlan);
  const createPlanMutation = useMutation(api.plans.createBlankPlan);

  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: PlanMetadata) => {
    try {
      setSaveError(null);
      if (selectedPlan) {
        posthog.capture('save_plan', { save_mode: 'edit' });
        await updateNameMutation({ planId: selectedPlan._id, name: data.name });
      } else if (data.clonedPlanId) {
        posthog.capture('save_plan', { save_mode: 'clone' });
        await clonePlanMutation({ planId: data.clonedPlanId as Id<'plans'> | 'template1' | 'template2', newPlanName: data.name });
      } else {
        posthog.capture('save_plan', { save_mode: 'create' });
        await createPlanMutation({ newPlanName: data.name });
      }

      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save plan.');
      console.error('Error saving plan: ', error);
    }
  };

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <FileTextIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>{selectedPlan ? 'Edit Plan' : 'New Plan'}</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Simulator plan details">
          <DialogBody>
            <FieldGroup>
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input
                  {...register('name')}
                  id="name"
                  name="name"
                  placeholder="My Plan"
                  autoComplete="off"
                  inputMode="text"
                  invalid={!!errors.name}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <ErrorMessage>{errors.name?.message}</ErrorMessage>}
              </Field>
              {!selectedPlan && (
                <Field>
                  <Label htmlFor="clonedPlanId">With Template</Label>
                  <Select {...register('clonedPlanId')} id="clonedPlanId" name="clonedPlanId">
                    <option value="">Blank plan</option>
                    <optgroup label="Your Plans">
                      {allPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          Copy of {plan.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Demo Plans">
                      <option value="template1">Standard Plan</option>
                      <option value="template2">Early Retirement Plan</option>
                    </optgroup>
                  </Select>
                  {errors.clonedPlanId && <ErrorMessage>{errors.clonedPlanId?.message}</ErrorMessage>}
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
