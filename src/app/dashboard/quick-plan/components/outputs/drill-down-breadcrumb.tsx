'use client';

import { useEffect } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';
import { useActiveSeed, useRemoveActiveSeed } from '@/hooks/use-active-seed';
import { useMultiSimulationResult } from '@/lib/stores/quick-plan-store';
import { cn } from '@/lib/utils';

interface DrillDownBreadcrumbProps {
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

export default function DrillDownBreadcrumb({ simulationMode }: DrillDownBreadcrumbProps) {
  const { analysis } = useMultiSimulationResult(simulationMode);

  const { activeSeed } = useActiveSeed(analysis);
  const removeActiveSeed = useRemoveActiveSeed();

  const withScrollPreservation = useScrollPreservation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (e.ctrlKey || e.metaKey) && activeSeed !== undefined) removeActiveSeed();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSeed, removeActiveSeed]);

  return (
    <nav aria-label="Breadcrumb" className="flex">
      <ol role="list" className="flex items-center space-x-2">
        <li>
          <div>
            <button
              type="button"
              className={cn('focus-outline', { 'text-muted-foreground hover:text-foreground': !!activeSeed })}
              onClick={withScrollPreservation(removeActiveSeed)}
              disabled={!activeSeed}
            >
              <span className="relative lowercase">
                Monte Carlo Results
                {activeSeed && (
                  <span className="text-muted-foreground absolute top-6 left-0 text-xs/6 font-medium tracking-tighter">
                    {navigator.userAgent.includes('Mac') ? '⌘ + esc' : 'Ctrl + Esc'}
                  </span>
                )}
              </span>
            </button>
          </div>
        </li>
        {activeSeed && (
          <li>
            <div className="flex items-center">
              <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0" />
              <span className="ml-2 font-semibold">{`Seed #${activeSeed}`}</span>
            </div>
          </li>
        )}
      </ol>
    </nav>
  );
}
