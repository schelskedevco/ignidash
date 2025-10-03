import { CheckIcon } from '@heroicons/react/20/solid';

import { cn } from '@/lib/utils';

const steps = [
  { name: 'Step 1', percent: 20 },
  { name: 'Step 2', percent: 40 },
  { name: 'Step 3', percent: 60 },
  { name: 'Step 4', percent: 80 },
  { name: 'Step 5', percent: 100 },
];

interface ProgressBarProps {
  progressPercent: number;
}

export default function ProgressBar({ progressPercent }: ProgressBarProps) {
  const getStepStatus = (stepPercent: number) => {
    if (progressPercent >= stepPercent) {
      return 'complete';
    } else if (progressPercent >= stepPercent - 20 && progressPercent < stepPercent) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => {
          const status = getStepStatus(step.percent);

          return (
            <li key={step.name} className={cn(stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '', 'relative')}>
              {status === 'complete' ? (
                <>
                  <div aria-hidden="true" className="absolute inset-0 flex items-center">
                    <div className="h-0.5 w-full bg-rose-600 dark:bg-rose-500" />
                  </div>
                  <a className="relative flex size-8 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-900 dark:bg-rose-500 dark:hover:bg-rose-400">
                    <CheckIcon aria-hidden="true" className="size-5 text-white" />
                    <span className="sr-only">{step.name}</span>
                  </a>
                </>
              ) : status === 'current' ? (
                <>
                  <div aria-hidden="true" className="absolute inset-0 flex items-center">
                    <div className="h-0.5 w-full bg-stone-200 dark:bg-white/15" />
                  </div>
                  <a
                    aria-current="step"
                    className="relative flex size-8 items-center justify-center rounded-full border-2 border-rose-600 bg-white dark:border-rose-500 dark:bg-stone-900"
                  >
                    <span aria-hidden="true" className="size-2.5 rounded-full bg-rose-600 dark:bg-rose-500" />
                    <span className="sr-only">{step.name}</span>
                  </a>
                </>
              ) : (
                <>
                  <div aria-hidden="true" className="absolute inset-0 flex items-center">
                    <div className="h-0.5 w-full bg-stone-200 dark:bg-white/15" />
                  </div>
                  <a className="group relative flex size-8 items-center justify-center rounded-full border-2 border-stone-300 bg-white hover:border-stone-400 dark:border-white/15 dark:bg-stone-900 dark:hover:border-white/25">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full bg-transparent group-hover:bg-stone-300 dark:group-hover:bg-white/15"
                    />
                    <span className="sr-only">{step.name}</span>
                  </a>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
