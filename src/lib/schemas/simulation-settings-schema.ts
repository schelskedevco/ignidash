import { z } from 'zod';

import { simulationModes } from '@/lib/stores/simulator-store';
import { coerceNumber } from '@/lib/utils/zod-schema-utils';

export const simulationSettingsSchema = z
  .object({
    simulationMode: z.enum(simulationModes),
    historicalStartYearOverride: coerceNumber(
      z.number().min(1928, 'Year cannot be before 1928').max(2024, 'Year cannot be after 2024')
    ).optional(),
    historicalRetirementStartYearOverride: coerceNumber(
      z.number().min(1928, 'Year cannot be before 1928').max(2024, 'Year cannot be after 2024')
    ).optional(),
  })
  .refine(
    (data) => {
      if (data.simulationMode !== 'historicalReturns') {
        return data.historicalStartYearOverride === undefined && data.historicalRetirementStartYearOverride === undefined;
      }

      return true;
    },
    {
      message: 'Historical start year is only valid for historical simulation mode',
    }
  );

export type SimulationSettingsInputs = z.infer<typeof simulationSettingsSchema>;
