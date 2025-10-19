'use client';

import { useEffect } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';
import { useActiveSeed, useRemoveActiveSeed } from '@/hooks/use-active-seed';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Kbd, KbdGroup } from '@/components/ui/kbd';

export default function DrillDownBreadcrumb() {
  const { activeSeed } = useActiveSeed();
  const removeActiveSeed = useRemoveActiveSeed();

  const withScrollPreservation = useScrollPreservation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (e.ctrlKey || e.metaKey) && activeSeed !== undefined) removeActiveSeed();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSeed, removeActiveSeed]);

  const isMac = navigator.userAgent.includes('Mac');

  const buttonComponent = (
    <button
      type="button"
      className={cn('focus-outline lowercase', { 'text-muted-foreground hover:text-foreground': !!activeSeed })}
      onClick={withScrollPreservation(removeActiveSeed)}
      disabled={!activeSeed}
    >
      Monte Carlo Results
    </button>
  );

  return (
    <nav aria-label="Breadcrumb" className="flex">
      <ol role="list" className="flex items-center space-x-2">
        <li>
          <div>
            {activeSeed ? (
              <Tooltip>
                <TooltipTrigger asChild>{buttonComponent}</TooltipTrigger>
                <TooltipContent>
                  <KbdGroup>
                    <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                    <span>+</span>
                    <Kbd>{isMac ? 'esc' : 'Esc'}</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
            ) : (
              buttonComponent
            )}
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
