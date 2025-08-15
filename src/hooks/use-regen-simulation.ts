import { ArrowPathIcon } from '@heroicons/react/20/solid';

import { useGenerateNewSeed } from '@/lib/stores/quick-plan-store';

export function useRegenSimulation() {
  const generateNewSeed = useGenerateNewSeed();

  return {
    icon: ArrowPathIcon,
    label: 'Regenerate simulation',
    handleClick: generateNewSeed,
    className: 'hover:-rotate-180 transition-transform duration-300',
  };
}
