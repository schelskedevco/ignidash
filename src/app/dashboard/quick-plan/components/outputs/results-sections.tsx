'use client';

import { useIsCalculationReady, useSimulationMode } from '@/lib/stores/quick-plan-store';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { Subheading } from '@/components/catalyst/heading';
import { HourglassIcon, LandmarkIcon, BanknoteArrowUpIcon, BanknoteArrowDownIcon } from 'lucide-react';

import SingleSimulationResults from './results-pages/single-simulation-results';
import MultiSimulationResults from './results-pages/multi-simulation-results';

export default function ResultsSections() {
  const { timelineIsReady, accountsAreReady, incomesAreReady, expensesAreReady } = useIsCalculationReady();
  const simulationMode = useSimulationMode();

  const steps = [
    { name: 'Set up your timeline', icon: HourglassIcon, status: timelineIsReady ? 'complete' : 'upcoming' },
    { name: 'Add at least one account', icon: LandmarkIcon, status: accountsAreReady ? 'complete' : 'upcoming' },
    { name: 'Add at least one income', icon: BanknoteArrowUpIcon, status: incomesAreReady ? 'complete' : 'upcoming' },
    { name: 'Add at least one expense', icon: BanknoteArrowDownIcon, status: expensesAreReady ? 'complete' : 'upcoming' },
  ];

  if (!(timelineIsReady && accountsAreReady && incomesAreReady && expensesAreReady)) {
    return (
      <div className="flex h-[calc(100vh-7.375rem)] flex-col items-center justify-center gap-8 lg:h-[calc(100vh-4.3125rem)]">
        <div className="px-4 py-12 sm:px-6 lg:px-8">
          <Subheading className="mb-4" level={3}>
            Prepare Your Simulation:
          </Subheading>
          <nav aria-label="Progress" className="flex justify-center">
            <ol role="list" className="space-y-6">
              {steps.map((step) => (
                <li key={step.name}>
                  {step.status === 'complete' ? (
                    <a className="group">
                      <span className="flex items-start">
                        <span className="relative flex size-5 shrink-0 items-center justify-center">
                          <CheckCircleIcon
                            aria-hidden="true"
                            className="size-full text-rose-600 group-hover:text-rose-800 dark:text-rose-400 dark:group-hover:text-rose-300"
                          />
                        </span>
                        <span className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">
                          {step.name}
                        </span>
                        <step.icon className="ml-3 size-5 shrink-0 text-rose-600 group-hover:text-rose-800 dark:text-rose-400 dark:group-hover:text-rose-300" />
                      </span>
                    </a>
                  ) : (
                    <a className="group">
                      <div className="flex items-start">
                        <div aria-hidden="true" className="relative flex size-5 shrink-0 items-center justify-center">
                          <div className="size-2 rounded-full bg-gray-300 group-hover:bg-gray-400 dark:bg-white/15 dark:group-hover:bg-white/25" />
                        </div>
                        <p className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">
                          {step.name}
                        </p>
                        <step.icon className="ml-3 size-5 shrink-0 text-rose-600 group-hover:text-rose-800 dark:text-rose-400 dark:group-hover:text-rose-300" />
                      </div>
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    );
  }

  switch (simulationMode) {
    case 'fixedReturns':
    case 'historicalReturns':
    case 'stochasticReturns':
      return <SingleSimulationResults simulationMode={simulationMode} />;
    case 'monteCarloStochasticReturns':
    case 'monteCarloHistoricalReturns':
      return <MultiSimulationResults simulationMode={simulationMode} />;
  }
}
