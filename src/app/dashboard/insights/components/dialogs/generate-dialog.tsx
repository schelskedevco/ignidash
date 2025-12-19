'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Id } from '@/convex/_generated/dataModel';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { simulationResultToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { generateInsightsSchema, type GenerateInsightsInputs } from '@/lib/schemas/generate-insights-schema';
import { Fieldset, FieldGroup, Field, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Button } from '@/components/catalyst/button';
import { Textarea } from '@/components/catalyst/textarea';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

interface GenerateDialogProps {
  onClose: () => void;
  onGenerate: () => void;
  planId: Id<'plans'>;
  keyMetrics: KeyMetrics;
  simulationResult: SimulationResult;
  hasExistingInsight: boolean;
}

export default function GenerateDialog({
  onClose,
  onGenerate,
  planId: _planId,
  keyMetrics: _keyMetrics,
  simulationResult: _simulationResult,
  hasExistingInsight: _hasExistingInsight,
}: GenerateDialogProps) {
  const [planId] = useState(_planId);
  const [keyMetrics] = useState(_keyMetrics);
  const [simulationResult] = useState(_simulationResult);
  const [hasExistingInsight] = useState(_hasExistingInsight);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(generateInsightsSchema),
    defaultValues: { userPrompt: undefined },
  });

  const m = useMutation(api.insights.generate);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: GenerateInsightsInputs) => {
    try {
      setSaveError(null);
      await m({ planId, keyMetrics, simulationResult: simulationResultToConvex(simulationResult), userPrompt: data.userPrompt });
      onGenerate();
      onClose();
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to generate insights.');
      console.error('Error generating insights: ', error);
    }
  };

  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <SparklesIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>Generate Insights</span>
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset aria-label="Generate insights">
          <DialogBody>
            <FieldGroup>
              {saveError && <ErrorMessageCard errorMessage={saveError} />}
              <Field>
                <Label htmlFor="userPrompt" className="flex w-full items-center justify-between">
                  <span className="whitespace-nowrap">Supplemental prompt</span>
                  <span className="text-muted-foreground hidden truncate text-sm/6 sm:inline">Optional</span>
                </Label>
                <Textarea
                  autoFocus
                  {...register('userPrompt')}
                  id="userPrompt"
                  name="userPrompt"
                  aria-label="Supplemental prompt"
                  placeholder="What's the impact of taking a lower-paying job I'd enjoy more?"
                  resizable={false}
                  rows={4}
                />
                {errors.userPrompt && <ErrorMessage>{errors.userPrompt?.message}</ErrorMessage>}
                <Description>
                  Enter a supplemental prompt for generating insights. If left blank, the system will generate standard insights based on
                  the selected plan.
                </Description>
              </Field>
              {hasExistingInsight && (
                <div role="alert" className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-500/10 dark:outline dark:outline-yellow-500/25">
                  <div className="flex">
                    <div className="shrink-0">
                      <ExclamationTriangleIcon aria-hidden="true" className="size-5 text-yellow-400 dark:text-yellow-500" />
                    </div>
                    <div className="ml-3">
                      <p className="line-clamp-3 text-sm text-yellow-700 dark:text-yellow-300">
                        An existing <span className="font-semibold">Insights</span> already exists for this plan. Regenerating will make it
                        no longer visible to you.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </FieldGroup>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={onClose} className="hidden sm:inline-flex" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button color="rose" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}
