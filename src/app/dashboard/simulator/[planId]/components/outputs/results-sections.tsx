'use client';

import { useState } from 'react';

import { usePlanData, useCountOfIncomes, useCountOfExpenses, useCountOfAccounts, useTimelineData } from '@/hooks/use-convex-data';
import { useIsCalculationReady } from '@/lib/stores/simulator-store';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { Subheading } from '@/components/catalyst/heading';
import { HourglassIcon, LandmarkIcon, BanknoteArrowUpIcon, BanknoteArrowDownIcon } from 'lucide-react';
import Drawer from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/catalyst/dialog';
import { cn } from '@/lib/utils';

import SingleSimulationResults from './results-pages/single-simulation-results';
import MultiSimulationResults from './results-pages/multi-simulation-results';
import TimelineDrawer from '../inputs/drawers/timeline-drawer';
import IncomeDialog from '../inputs/dialogs/income-dialog';
import ExpenseDialog from '../inputs/dialogs/expense-dialog';
import SavingsDialog from '../inputs/dialogs/savings-dialog';

export default function ResultsSections() {
  const { data: inputs, isLoading } = usePlanData();

  const { timelineIsReady, accountsAreReady, incomesAreReady, expensesAreReady } = useIsCalculationReady(inputs);
  const simulationMode = inputs?.simulationSettings.simulationMode;

  const steps = [
    {
      name: 'Set up your timeline',
      onClick: () => setTimelineOpen(true),
      icon: HourglassIcon,
      status: timelineIsReady ? 'complete' : 'upcoming',
    },
    {
      name: 'Add at least one income',
      onClick: () => setIncomeDialogOpen(true),
      icon: BanknoteArrowUpIcon,
      status: incomesAreReady ? 'complete' : 'upcoming',
    },
    {
      name: 'Add at least one expense',
      onClick: () => setExpenseDialogOpen(true),
      icon: BanknoteArrowDownIcon,
      status: expensesAreReady ? 'complete' : 'upcoming',
    },
    {
      name: 'Add at least one account',
      onClick: () => setSavingsDialogOpen(true),
      icon: LandmarkIcon,
      status: accountsAreReady ? 'complete' : 'upcoming',
    },
  ];

  const [timelineOpen, setTimelineOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);

  const handleIncomeDialogClose = () => setIncomeDialogOpen(false);
  const handleExpenseDialogClose = () => setExpenseDialogOpen(false);
  const handleSavingsDialogClose = () => setSavingsDialogOpen(false);

  const numIncomes = useCountOfIncomes();
  const numExpenses = useCountOfExpenses();
  const numAccounts = useCountOfAccounts();

  const timeline = useTimelineData();

  if (!(timelineIsReady && accountsAreReady && incomesAreReady && expensesAreReady)) {
    const timelineTitleComponent = (
      <div className="flex items-center gap-2">
        <HourglassIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
        <span>Timeline</span>
      </div>
    );

    return (
      <>
        <div
          className={cn('flex h-[calc(100vh-7.375rem)] w-full flex-col items-center gap-8 lg:h-[calc(100vh-4.3125rem)]', {
            'justify-center': !isLoading,
          })}
        >
          {isLoading ? (
            <div className="flex w-full flex-col gap-5 py-5">
              <div className="grid grid-cols-2 gap-2 2xl:grid-cols-3">
                <Skeleton className="col-span-2 h-[110px] w-full rounded-xl 2xl:col-span-1" />
                <Skeleton className="col-span-2 h-[110px] w-full rounded-xl" />
                <Skeleton className="h-[110px] w-full rounded-xl" />
                <Skeleton className="h-[110px] w-full rounded-xl" />
                <Skeleton className="hidden h-[110px] w-full rounded-xl 2xl:block" />
                <Skeleton className="h-[110px] w-full rounded-xl 2xl:col-span-2" />
                <Skeleton className="h-[110px] w-full rounded-xl" />
              </div>
              <Skeleton className="h-[55px] w-full rounded-xl" />
              <div className="grid grid-cols-1 gap-2 @[120rem]:grid-cols-2">
                <Skeleton className="h-[475px] w-full rounded-xl" />
                <Skeleton className="h-[475px] w-full rounded-xl" />
                <div className="@[120rem]:col-span-2">
                  <Skeleton className="h-[275px] w-full rounded-xl" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-12 sm:px-6 lg:px-8">
                <Subheading className="mb-4" level={3}>
                  Prepare Your Simulation:
                </Subheading>
                <nav aria-label="Progress" className="flex justify-center">
                  <ol role="list" className="space-y-6">
                    {steps.map((step) => (
                      <li key={step.name}>
                        <button className="group focus-outline cursor-pointer" onClick={step.onClick} type="button">
                          <span className="flex items-start">
                            <span className="relative flex size-5 shrink-0 items-center justify-center">
                              {step.status === 'complete' ? (
                                <CheckCircleIcon
                                  aria-hidden="true"
                                  className="size-full text-rose-600 group-hover:text-rose-800 dark:text-rose-400 dark:group-hover:text-rose-300"
                                />
                              ) : (
                                <XCircleIcon
                                  aria-hidden="true"
                                  className="size-full text-stone-300 group-hover:text-stone-400 dark:text-white/25 dark:group-hover:text-white/50"
                                />
                              )}
                            </span>
                            <span className="text-muted-foreground group-hover:text-foreground ml-3 text-sm font-medium">{step.name}</span>
                            <step.icon className="ml-3 size-5 shrink-0 text-rose-600 group-hover:text-rose-800 dark:text-rose-400 dark:group-hover:text-rose-300" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </>
          )}
        </div>
        <Drawer open={timelineOpen} setOpen={setTimelineOpen} title={timelineTitleComponent}>
          <TimelineDrawer setOpen={setTimelineOpen} timeline={timeline} />
        </Drawer>
        <Dialog size="xl" open={incomeDialogOpen} onClose={handleIncomeDialogClose}>
          <IncomeDialog selectedIncome={null} numIncomes={numIncomes} onClose={handleIncomeDialogClose} />
        </Dialog>
        <Dialog size="xl" open={expenseDialogOpen} onClose={handleExpenseDialogClose}>
          <ExpenseDialog selectedExpense={null} numExpenses={numExpenses} onClose={handleExpenseDialogClose} />
        </Dialog>
        <Dialog size="xl" open={savingsDialogOpen} onClose={handleSavingsDialogClose}>
          <SavingsDialog selectedAccount={null} numAccounts={numAccounts} onClose={handleSavingsDialogClose} />
        </Dialog>
      </>
    );
  }

  switch (simulationMode) {
    case 'fixedReturns':
    case 'historicalReturns':
    case 'stochasticReturns':
      return <SingleSimulationResults inputs={inputs!} simulationMode={simulationMode} />;
    case 'monteCarloStochasticReturns':
    case 'monteCarloHistoricalReturns':
      return <MultiSimulationResults inputs={inputs!} simulationMode={simulationMode} />;
  }
}
