import { z } from 'zod';

export const privacySettingsFormSchema = z.object({
  isPrivate: z.boolean(),
});

export type PrivacySettingsInputs = z.infer<typeof privacySettingsFormSchema>;
