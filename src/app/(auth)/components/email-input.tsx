import { ExclamationCircleIcon } from '@heroicons/react/16/solid';

import { cn } from '@/lib/utils';

interface EmailInputProps {
  errorMessage: string | null;
}

export default function EmailInput({ errorMessage }: EmailInputProps) {
  return (
    <div>
      <label htmlFor="email" className="block text-sm/6 font-medium text-stone-900 dark:text-white">
        Email address
      </label>
      <div className="relative mt-2">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={!!errorMessage}
          {...(errorMessage && { 'aria-describedby': 'email-error' })}
          className={cn(
            'block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-stone-900 outline-1 -outline-offset-1 outline-stone-400 placeholder:text-stone-400 focus:outline-2 focus:-outline-offset-2 focus:outline-rose-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/25 dark:placeholder:text-stone-500 dark:focus:outline-rose-500',
            {
              'text-red-900 outline-red-300 placeholder:text-red-300 dark:text-red-400 dark:outline-red-500/50 dark:placeholder:text-red-400/70':
                !!errorMessage,
            }
          )}
        />
        {!!errorMessage && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex shrink-0 items-center pr-3 text-red-500 dark:text-red-400">
            <ExclamationCircleIcon aria-hidden="true" className="h-5 w-5" />
          </div>
        )}
      </div>
      {!!errorMessage && (
        <p id="email-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
