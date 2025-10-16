'use client';

import { ChevronRightIcon } from '@heroicons/react/20/solid';

import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';

interface DrillDownBreadcrumbProps {
  activeSeed: number | undefined;
  removeActiveSeed: () => void;
  rootLabel: string;
}

export default function DrillDownBreadcrumb({ activeSeed, removeActiveSeed, rootLabel }: DrillDownBreadcrumbProps) {
  const withScrollPreservation = useScrollPreservation();

  return (
    <nav aria-label="Breadcrumb" className="flex">
      <ol role="list" className="flex items-center space-x-2">
        <li>
          <div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus-outline"
              onClick={withScrollPreservation(() => removeActiveSeed())}
            >
              <span>{rootLabel}</span>
            </button>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0" />
            <span className="ml-2">{`Seed #${activeSeed}`}</span>
          </div>
        </li>
      </ol>
    </nav>
  );
}
