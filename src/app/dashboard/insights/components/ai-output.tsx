'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import Link from 'next/link';
import { SparklesIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { CopyIcon, CheckIcon } from 'lucide-react';

import { Heading } from '@/components/catalyst/heading';
import { useInsightsSelectedPlan } from '@/lib/stores/simulator-store';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';
import { Dialog } from '@/components/catalyst/dialog';
import { cn } from '@/lib/utils';

import GenerateDialog from './dialogs/generate-dialog';

export default function AIOutput() {
  const selectedPlan = useInsightsSelectedPlan();

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const handleGenerateDialogClose = () => setGenerateDialogOpen(false);

  const insights = useQuery(api.insights.get, selectedPlan ? { planId: selectedPlan.id } : 'skip');

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const contentToCopy = insights?.content;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <div
          className={cn(
            'flex h-[calc(100%-4.0625rem)] w-full flex-col items-center justify-center sm:h-[calc(100%-5.0625rem)] lg:size-full',
            { 'px-4 py-5 sm:py-6': !insights }
          )}
        >
          {insights ? (
            <div className="w-full flex-1 overflow-y-auto">
              <div className="prose prose-sm prose-zinc dark:prose-invert mx-auto px-4 py-5 sm:py-6">
                <ReactMarkdown>{insights.content}</ReactMarkdown>
                <div className="border-border/50 flex items-center gap-2 border-t pt-4">
                  <p className="text-foreground/60 text-xs">
                    <time dateTime={new Date(insights._creationTime).toISOString()}>
                      {new Date(insights._creationTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </p>
                  <button
                    onClick={handleCopy}
                    aria-label="Copy insights"
                    className="text-xs opacity-60 transition-opacity hover:opacity-100"
                  >
                    {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <DataListEmptyStateButton
              onClick={() => setGenerateDialogOpen(true)}
              icon={SparklesIcon}
              buttonText="Generate insights"
              disabled={selectedPlan === undefined}
            />
          )}
        </div>
      </div>
      {selectedPlan && (
        <Dialog size="xl" open={generateDialogOpen} onClose={handleGenerateDialogClose}>
          <GenerateDialog onClose={handleGenerateDialogClose} planId={selectedPlan.id} {...selectedPlan} />
        </Dialog>
      )}
    </>
  );
}
