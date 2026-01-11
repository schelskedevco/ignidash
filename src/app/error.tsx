'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);

    // PostHog: Track error page viewed and capture exception
    posthog.capture('error_page_viewed', {
      error_message: error.message,
      error_digest: error.digest,
    });
    posthog.captureException(error);
  }, [error]);

  return (
    <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8 dark:bg-stone-900">
      <div className="text-center">
        <p className="text-base font-semibold text-rose-600 dark:text-rose-400">500</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-stone-900 sm:text-7xl dark:text-white">
          Unexpected error
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-stone-500 sm:text-xl/8 dark:text-stone-400">
          Sorry, something unexpected happened. Please try again.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button
            onClick={reset}
            className="rounded-md bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:bg-rose-500 dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
          >
            Try again
          </button>
          <a
            href="mailto:joe@schelske.dev?subject=Support Request&body=Hello, I need help with..."
            className="text-sm font-semibold text-stone-900 dark:text-white"
          >
            Contact support <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  );
}
