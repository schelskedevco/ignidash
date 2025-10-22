import { RefreshCwIcon } from 'lucide-react';

import { useUpdateSimulationSeed, useSimulationStatus, useSimulationMode } from '@/lib/stores/quick-plan-store';

export function useRegenSimulation() {
  const updateSimulationSeed = useUpdateSimulationSeed();
  const simulationStatus = useSimulationStatus();
  const simulationMode = useSimulationMode();

  const isDisabled = simulationStatus === 'loading' || simulationMode === 'fixedReturns';

  const handleClick = () => {
    if (!isDisabled) updateSimulationSeed();
  };

  return {
    icon: RefreshCwIcon,
    label: 'Regenerate Simulation',
    handleClick,
    isDisabled,
  };
}
