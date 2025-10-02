import { RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';

import { useUpdateSimulationSeed } from '@/lib/stores/quick-plan-store';

export function useRegenSimulation() {
  const updateSimulationSeed = useUpdateSimulationSeed();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleClick = () => {
    if (isDisabled) return;

    updateSimulationSeed();
    setIsDisabled(true);

    setTimeout(() => {
      setIsDisabled(false);
    }, 5000);
  };

  return {
    icon: RefreshCwIcon,
    label: 'Regenerate simulation',
    handleClick,
    isDisabled,
    className: 'hover:-rotate-180 transition-transform duration-300',
  };
}
