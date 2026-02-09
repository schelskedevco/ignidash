import { z } from 'zod';

import { percentageField } from '@/lib/utils/zod-schema-utils';

const glidePathTimePointSchema = z
  .object({
    type: z.enum(['customDate', 'customAge']),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    age: z.number().int().min(0).max(120).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'customDate') {
        return data.month !== undefined && data.year !== undefined && data.age === undefined;
      }
      if (data.type === 'customAge') {
        return data.age !== undefined && data.month === undefined && data.year === undefined;
      }
      return true;
    },
    {
      message: 'Custom fields are required when custom option is selected',
    }
  );

export type GlidePathTimePoint = z.infer<typeof glidePathTimePointSchema>;

export const glidePathFormSchema = z.object({
  id: z.string(),
  endTimePoint: glidePathTimePointSchema,
  targetBondAllocation: percentageField(0, 100, 'Target bond allocation'),
  enabled: z.boolean().default(false),
});

export type GlidePathInputs = z.infer<typeof glidePathFormSchema>;
