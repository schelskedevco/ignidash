'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import posthog from 'posthog-js';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { simulationResultToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { generateInsightsSchema, type GenerateInsightsInputs } from '@/lib/schemas/generate-insights-schema';
import { Fieldset, FieldGroup, Field, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Button } from '@/components/catalyst/button';
import { Textarea } from '@/components/catalyst/textarea';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import { getErrorMessages } from '@/lib/utils/form-utils';

interface GenerateDialogProps {
  onClose: () => void;
  onGenerate: () => void;
  canUseInsights: boolean;
  planId: Id<'plans'>;
  keyMetrics: KeyMetrics;
  simulationResult: SimulationResult;
}

export default function GenerateDialog({
  onClose,
  onGenerate,
  canUseInsights,
  planId: _planId,
  keyMetrics: _keyMetrics,
  simulationResult: _simulationResult,
}: GenerateDialogProps) {
  const [planId] = useState(_planId);
  const [keyMetrics] = useState(_keyMetrics);
  const [simulationResult] = useState(_simulationResult);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(generateInsightsSchema),
    defaultValues: { userPrompt: undefined },
  });

  const hasFormErrors = Object.keys(errors).length > 0;

  const m = useMutation(api.insights.generate);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: GenerateInsightsInputs) => {
    try {
      setSaveError(null);
      posthog.capture('generate_insights', { plan_id: planId, has_user_prompt: !!data.userPrompt });
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
              {(saveError || hasFormErrors) && <ErrorMessageCard errorMessage={saveError || getErrorMessages(errors).join(', ')} />}
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
              <Divider soft />
              <Description>
                {canUseInsights ? (
                  <>
                    <strong>Disclaimer:</strong> AI insights are for educational purposes only and do not provide professional financial
                    advice. For more information, read our{' '}
                    <Link href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Terms of Service
                    </Link>
                    .
                  </>
                ) : (
                  <strong>
                    Upgrade to start generating insights.{' '}
                    <Link href="/pricing" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      View pricing →
                    </Link>
                  </strong>
                )}
              </Description>
            </FieldGroup>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={onClose} className="hidden sm:inline-flex" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button color="rose" type="submit" disabled={isSubmitting || !canUseInsights}>
            {isSubmitting ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
}
