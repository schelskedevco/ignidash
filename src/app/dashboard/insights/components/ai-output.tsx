'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SparklesIcon } from 'lucide-react';

import { Heading } from '@/components/catalyst/heading';
import { useInsightsSelectedPlan } from '@/lib/stores/simulator-store';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';
import { Dialog } from '@/components/catalyst/dialog';

import GenerateDialog from './dialogs/generate-dialog';

export default function AIOutput() {
  const selectedPlan = useInsightsSelectedPlan();

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const handleGenerateDialogClose = () => setGenerateDialogOpen(false);

  return (
    <>
      <div className="-mx-2 h-full sm:-mx-3 lg:-mx-4 lg:pr-96">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {selectedPlan ? (
            <Heading level={3} className="truncate whitespace-nowrap">
              Insights for{' '}
              <Link
                href={`/dashboard/simulator/${selectedPlan?.id}`}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedPlan?.name}
              </Link>
            </Heading>
          ) : (
            <Heading level={3} className="truncate whitespace-nowrap">
              Select a plan <span aria-hidden="true">&rarr;</span>
            </Heading>
          )}
        </header>
        <div className="flex h-[calc(100%-4.0625rem)] w-full flex-col items-center justify-center px-4 py-5 sm:h-[calc(100%-5.0625rem)] sm:py-6 lg:size-full">
          <DataListEmptyStateButton
            onClick={() => setGenerateDialogOpen(true)}
            icon={SparklesIcon}
            buttonText="Generate insights"
            disabled={selectedPlan === undefined}
          />
        </div>
      </div>
      {selectedPlan && selectedPlan.keyMetrics && (
        <Dialog size="xl" open={generateDialogOpen} onClose={handleGenerateDialogClose}>
          <GenerateDialog onClose={handleGenerateDialogClose} planId={selectedPlan.id} keyMetrics={selectedPlan.keyMetrics} />
        </Dialog>
      )}
    </>
  );
}
