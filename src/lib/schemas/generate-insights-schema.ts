import { z } from 'zod';

export const generateInsightsSchema = z.object({
  userPrompt: z.string().max(250, 'Supplemental prompt cannot be longer than 250 characters').optional(),
});

export type GenerateInsightsInputs = z.infer<typeof generateInsightsSchema>;
