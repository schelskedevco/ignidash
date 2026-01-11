'use client';

import { useQuery, usePaginatedQuery } from 'convex/react';
import { useSmoothText } from '@convex-dev/agent/react';
import { api } from '@/convex/_generated/api';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { SparklesIcon, CopyIcon, CheckIcon, RefreshCwIcon, Loader2Icon } from 'lucide-react';
import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/20/solid';
import ReactMarkdown from 'react-markdown';
import posthog from 'posthog-js';

import { Heading } from '@/components/catalyst/heading';
import { useInsightsSelectedPlan } from '@/lib/stores/simulator-store';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/catalyst/dialog';

import GenerateDialog from './dialogs/generate-dialog';

function InsightsTextWhileLoading({ content }: { content: string }) {
  const [visibleText] = useSmoothText(content, { startStreaming: true, charsPerSec: 64 });
  return <ReactMarkdown>{visibleText}</ReactMarkdown>;
}

export default function AIOutput() {
  const selectedPlan = useInsightsSelectedPlan();
  const selectedPlanId = selectedPlan?.id;

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const handleGenerateDialogClose = () => setGenerateDialogOpen(false);

  const numInsights = useQuery(api.insights.getCountOfInsights, selectedPlan ? { planId: selectedPlan.id } : 'skip');
  const canUseInsights = useQuery(api.insights.canUseInsights) ?? false;

  const { results, status, loadMore } = usePaginatedQuery(api.insights.list, selectedPlan ? { planId: selectedPlan.id } : 'skip', {
    initialNumItems: 1,
  });
  const insights = useMemo(() => results.sort((a, b) => b.updatedAt - a.updatedAt), [results]);
  const isLoadingPage = status === 'LoadingFirstPage' || status === 'LoadingMore';

  const [selectedInsightIndex, setSelectedInsightIndex] = useState<number>(0);
  const selectedInsight = insights.length > 0 && selectedInsightIndex <= insights.length - 1 ? insights[selectedInsightIndex] : null;

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const contentToCopy = selectedInsight?.content;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const disablePrevious = selectedInsightIndex === 0;
  const handlePrevious = () => {
    if (disablePrevious) return;
    setSelectedInsightIndex((prev) => prev - 1);
  };

  const disableNext = !numInsights || selectedInsightIndex >= numInsights - 1 || status === 'LoadingMore';
  const handleNext = () => {
    if (disableNext) return;

    if (status === 'CanLoadMore') loadMore(1);
    setSelectedInsightIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (selectedPlanId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedInsightIndex(0);
    }
  }, [selectedPlanId]);

  return (
    <>
      <div className="-mx-2 h-full sm:-mx-3 lg:-mx-4 lg:pr-96">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {selectedPlan ? (
            <div className="flex w-full items-center justify-between">
              <Heading level={3} className="truncate whitespace-nowrap">
                Insights for{' '}
                <Link
                  href={`/dashboard/simulator/${selectedPlan?.id}`}
                  className="text-primary focus-outline mr-1.5 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedPlan?.name}
                </Link>
              </Heading>
              {numInsights && numInsights > 0 ? (
                <nav className="flex shrink-0 items-center">
                  <button
                    onClick={handlePrevious}
                    disabled={disablePrevious}
                    className="group focus-outline inline-flex items-center text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLongLeftIcon
                      aria-hidden="true"
                      className="mr-3 size-5 text-stone-400 group-hover:text-stone-700 dark:text-stone-500 dark:group-hover:text-stone-300"
                    />
                  </button>
                  <span className="text-sm font-medium">
                    {selectedInsightIndex + 1} of {numInsights}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={disableNext}
                    className="group focus-outline inline-flex items-center text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLongRightIcon
                      aria-hidden="true"
                      className="ml-3 size-5 text-stone-400 group-hover:text-stone-700 dark:text-stone-500 dark:group-hover:text-stone-300"
                    />
                  </button>
                </nav>
              ) : null}
            </div>
          ) : (
            <Heading level={3} className="truncate whitespace-nowrap">
              Select a plan <span aria-hidden="true">&rarr;</span>
            </Heading>
          )}
        </header>
        <div className="flex h-[calc(100%-4.0625rem)] w-full flex-col items-center justify-center sm:h-[calc(100%-5.0625rem)] lg:size-full">
          {selectedInsight && (
            <div className="w-full flex-1 overflow-y-auto">
              <div className="prose prose-sm prose-stone dark:prose-invert mx-auto px-4 py-5 sm:py-6">
                {selectedInsight.content ? (
                  !selectedInsight.isLoading ? (
                    <ReactMarkdown>{selectedInsight.content}</ReactMarkdown>
                  ) : (
                    <InsightsTextWhileLoading content={selectedInsight.content} />
                  )
                ) : (
                  <div className="flex gap-1 pt-4 pb-8">
                    <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                    <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                    <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full" />
                  </div>
                )}
                <div className="border-border/50 flex items-center gap-3 border-t">
                  <p className="text-foreground/60 text-sm">
                    <time
                      dateTime={new Date(selectedInsight._creationTime).toLocaleString([], {
                        month: 'numeric',
                        day: 'numeric',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    >
                      {new Date(selectedInsight._creationTime).toLocaleString([], {
                        month: 'numeric',
                        day: 'numeric',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </p>
                  <button
                    onClick={handleCopy}
                    aria-label="Copy insights"
                    className="focus-outline text-sm opacity-60 transition-opacity hover:opacity-100"
                  >
                    {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </button>
                  <button
                    disabled={selectedInsight.isLoading}
                    onClick={() => {
                      posthog.capture('open_generate_insights', { plan_id: selectedPlanId, is_regenerate: true });
                      setGenerateDialogOpen(true);
                    }}
                    aria-label="Regenerate insights"
                    className="focus-outline text-sm opacity-60 transition-all duration-300 hover:rotate-180 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectedInsight.isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <RefreshCwIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!selectedInsight && (
            <div className="flex size-full flex-col items-center px-4 py-5 sm:py-6">
              {!isLoadingPage || numInsights === 0 ? (
                <DataListEmptyStateButton
                  onClick={() => {
                    posthog.capture('open_generate_insights', { plan_id: selectedPlanId, is_regenerate: false });
                    setGenerateDialogOpen(true);
                  }}
                  icon={SparklesIcon}
                  buttonText="Generate insights"
                  className="flex-1"
                  disabled={selectedPlan === undefined}
                />
              ) : (
                <div className="flex w-full max-w-prose flex-col gap-4">
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                  <Skeleton className="h-[75px] w-full rounded-xl" />
                  <Skeleton className="h-[350px] w-full rounded-xl" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {selectedPlan && (
        <Dialog size="xl" open={generateDialogOpen} onClose={handleGenerateDialogClose}>
          <GenerateDialog
            onClose={handleGenerateDialogClose}
            onGenerate={() => setSelectedInsightIndex(0)}
            canUseInsights={canUseInsights}
            planId={selectedPlan.id}
            {...selectedPlan}
          />
        </Dialog>
      )}
    </>
  );
}
