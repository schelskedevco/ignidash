import { z } from 'zod';

import { simulationModes } from '@/lib/stores/quick-plan-store';

export const simulationSettingsSchema = z
  .object({
    simulationMode: z.enum(simulationModes),
    historicalStartYearOverride: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.simulationMode !== 'historicalReturns') return data.historicalStartYearOverride === undefined;

      return true;
    },
    {
      message: 'Historical start year is only valid for historical simulation mode',
      path: ['historicalStartYearOverride'],
    }
  )
  .refine(
    (data) => {
      if (data.historicalStartYearOverride !== undefined) {
        return data.historicalStartYearOverride >= 1928 && data.historicalStartYearOverride <= 2024;
      }

      return true;
    },
    {
      message: 'Historical start year must be between 1928 and 2024',
      path: ['historicalStartYearOverride'],
    }
  );

export type SimulationSettingsInputs = z.infer<typeof simulationSettingsSchema>;
