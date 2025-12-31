import { RefreshCwIcon } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { useSimulationStatus } from '@/lib/stores/simulator-store';

import { useSelectedPlanId } from './use-selected-plan-id';
import { useSimulationSettingsData } from './use-convex-data';

export function useRegenSimulation() {
  const planId = useSelectedPlanId();

  const simulationSettings = useSimulationSettingsData();
  const simulationStatus = useSimulationStatus();

  const isDisabled = !simulationSettings || simulationStatus === 'loading' || simulationSettings.simulationMode === 'fixedReturns';

  const m = useMutation(api.simulation_settings.update);
  const handleClick = async () => {
    if (!isDisabled) {
      track('Regenerate simulation', { simulationMode: simulationSettings.simulationMode });
      posthog.capture('regenerate_simulation', { simulationMode: simulationSettings.simulationMode });
      await m({ simulationSettings: { ...simulationSettings, simulationSeed: Math.floor(Math.random() * 1000) }, planId });
    }
  };

  return { icon: RefreshCwIcon, label: 'Regenerate Simulation', handleClick, isDisabled };
}
