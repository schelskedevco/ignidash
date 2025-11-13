'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { FileTextIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { planMetadataSchema, type PlanMetadata } from '@/lib/schemas/plan-metadata-schema';
import { Fieldset, FieldGroup, Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface PlanDialogProps {
  onClose: () => void;
  numPlans: number;
  selectedPlan: { id: Id<'plans'>; name: string } | null;
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planMetadataSchema),
    defaultValues,
  });

  const updateNameMutation = useMutation(api.plans.updatePlanName);
  const clonePlanMutation = useMutation(api.plans.clonePlan);
  const createPlanMutation = useMutation(api.plans.createBlankPlan);

  const onSubmit = async (data: PlanMetadata) => {
    if (selectedPlan) {
      await updateNameMutation({ planId: selectedPlan!.id, name: data.name });
    } else if (data.clonedPlanId) {
      await clonePlanMutation({ planId: data.clonedPlanId as Id<'plans'> | 'template1' | 'template2', newPlanName: data.name });
    } else {
      await createPlanMutation({ newPlanName: data.name });
    }

    onClose();
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
        <Fieldset aria-label="Plan metadata">
          <DialogBody>
            <FieldGroup>
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
                    <optgroup label="Templates">
                      <option value="template1">Standard Plan</option>
                      <option value="template2">Early Retirement Plan</option>
                    </optgroup>
                  </Select>
                </Field>
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
